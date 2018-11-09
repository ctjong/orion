import * as awsSdk from "aws-sdk";
import { IConfig, Context, IUploadFileResponse } from "../types";
import { execService } from "../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import * as mime from "mime-types";
import { IStorageCommandWrapper } from "./iStorageCommandWrapper";
import { StorageCommandWrapper } from "./storageCommmandWrapper";

/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
export class S3StorageAdapter
{
    private wrapper:IStorageCommandWrapper;

    /**
     * Initialize the adapter
     * @param config config object
     * @param wrapper optional commmand wrapper module
     */
    constructor(config:IConfig, wrapper?:IStorageCommandWrapper)
    {
        if(wrapper)
            this.wrapper = wrapper;
        else
        {
            if(!config.storage.awsAccessKeyId || !config.storage.awsSecretAccessKey)
            throw "Missing awsAccessKeyId or awsSecretAccessKey in the config";
            this.wrapper = new StorageCommandWrapper(null, new awsSdk.S3(
            { 
                accessKeyId: config.storage.awsAccessKeyId, 
                secretAccessKey: config.storage.awsSecretAccessKey
            }));
        }
    }

    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     * @param callback Callback function
     */
    uploadFileAsync(ctx:Context, req:any): Promise<IUploadFileResponse>
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
                execService.catchAllErrorsAsync(ctx, async () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("8dad", 400, "submitted file is not a valid file");
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    const error = await this.wrapper.s3UploadAsync(
                    {
                        Bucket: ctx.config.storage.s3Bucket,
                        Key: name,
                        ACL: 'public-read',
                        Body: stream,
                        ContentLength: stream.byteCount,
                        ContentType: mime.lookup(name)
                    });
                    resolve({ error: error, name: name });
                });
            });
            form.on('progress', (bytesReceived:number, bytesExpected:number) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService.sendErrorResponse(ctx, "49ef", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err:any) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
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
    deleteFileAsync(ctx:Context, filename:string): Promise<any>
    {
        return this.wrapper.s3DeleteAsync(
        {
            Key: filename,
            Bucket: ctx.config.storage.s3Bucket
        });
    }
}