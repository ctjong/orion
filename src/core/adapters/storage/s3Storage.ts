import * as awsSdk from "aws-sdk";
import { Config, Context, UploadFileResponse } from "../../types";
import { execService } from "../../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import * as mime from "mime-types";

/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
export class S3Storage
{
    private provider:any;

    /**
     * Initialize the adapter
     * @param config config object
     * @param provider optional provider module
     */
    constructor(config:Config, provider?:any)
    {
        if(provider)
            this.provider = provider;
        else
        {
            if(!config.storage.awsAccessKeyId || !config.storage.awsSecretAccessKey)
            throw "Missing awsAccessKeyId or awsSecretAccessKey in the config";
            this.provider = new awsSdk.S3(
            { 
                accessKeyId: config.storage.awsAccessKeyId, 
                secretAccessKey: config.storage.awsSecretAccessKey
            });
        }
    }

    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     * @param callback Callback function
     */
    uploadFile(ctx:Context, req:any): Promise<UploadFileResponse>
    {
        return new Promise(resolve =>
        {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)(
            {
                autoFields: true
            });
            form.on('part', (stream) => 
            {
                execService.catchAllErrors(ctx, () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("8dad", 400, "submitted file is not a valid file");
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    this.provider.upload(
                    {
                        Bucket: ctx.config.storage.s3Bucket,
                        Key: name,
                        ACL: 'public-read',
                        Body: stream,
                        ContentLength: stream.byteCount,
                        ContentType: mime.lookup(name)
                    },
                    (s3UploadErr:any, data:any) =>
                    {
                        execService.catchAllErrors(ctx, () =>
                        {
                            resolve({ error: s3UploadErr, name: name });
                        });
                    });
                });
            });
            form.on('progress', (bytesReceived:number, bytesExpected:number) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService.sendErrorResponse(ctx, "49ef", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err:any) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    execService.sendErrorResponse(ctx, "a95a", 400, "error while parsing form data");
                });
            });
            form.parse(req);
        });
    }

    /**
     * Delete a file from the storage
     * @param ctx Request context
     * @param filename File name to delete
     * @param callback Callback function
     */
    deleteFile(ctx:Context, filename:string): Promise<any>
    {
        return new Promise(resolve =>
        {
            this.provider.deleteObject(
            {
                Key: filename,
                Bucket: ctx.config.storage.s3Bucket
            },
            (error:any, data:any) =>
            {
                resolve(error);
            });
        });
    }
}