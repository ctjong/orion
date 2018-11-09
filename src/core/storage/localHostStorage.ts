import * as path from "path";
import { IConfig, Context, IUploadFileResponse } from "../types";
import * as fs from "fs";
import { execService } from "../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";

/**
 * A module to handle file upload/delete on local server storage
 */
export class LocalHostStorage
{
    private provider:any;

    /**
     * Initialize the adapter
     * @param config config object
     * @param provider optional provider module
     */
    constructor(config:IConfig, provider?:any)
    {
        if(provider)
            this.provider = provider;
        else
            this.provider = fs;
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
            const form = new (multiparty.Form)(
            {
                autoFiles: true,
                uploadDir: ctx.config.storage.uploadPath
            });
            form.on('file', (name:string, file:any) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    const tempPath = file.path;
                    const tempName = path.basename(tempPath);
                    const finalName = guid() + tempName.substring(tempName.lastIndexOf("."));
                    const finalPath = tempPath.replace(tempName, finalName);
                    this.provider.rename(tempPath, finalPath, (error:any) =>
                    {
                        execService.catchAllErrorsAsync(ctx, () =>
                        {
                            resolve({ error: error, name: finalName });
                        });
                    });
                });
            });
            form.on('error', (err) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    execService.sendErrorResponse(ctx, "8651", 400, "error while parsing form data");
                });
            });
            form.parse(req);
        });
    }

    /**
     * Delete a file from the storage
     * @param ctx Request context
     * @param filename File name to delete
     */
    deleteFileAsync(ctx:Context, filename:string): Promise<any>
    {
        return new Promise(resolve =>
        {
            const fullPath = ctx.config.storage.uploadPath + "/" + filename;
            this.provider.unlink(fullPath, (error:any) =>
            {
                resolve(error);
            });
        });
    }
};