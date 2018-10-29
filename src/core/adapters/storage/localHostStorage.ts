import * as path from "path";
import { Config, Context, UploadFileResponse } from "../../types";
import * as fs from "fs";
import { execService } from "../../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";

/**
 * A module to handle file upload/delete on local server storage
 */
export class LocalHostStorage
{
    provider:any;

    /**
     * Initialize the adapter
     * @param config config object
     */
    constructor(config:Config)
    {
        this.provider = fs;
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
            const form = new (multiparty.Form)(
            {
                autoFiles: true,
                uploadDir: ctx.config.storage.uploadPath
            });
            form.on('file', (name:string, file:any) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    const tempPath = file.path;
                    const tempName = path.basename(tempPath);
                    const finalName = guid() + tempName.substring(tempName.lastIndexOf("."));
                    const finalPath = tempPath.replace(tempName, finalName);
                    this.provider.rename(tempPath, finalPath, (error:any) =>
                    {
                        execService.catchAllErrors(ctx, () =>
                        {
                            resolve({ error: error, name: finalName });
                        });
                    });
                });
            });
            form.on('error', (err) =>
            {
                execService.catchAllErrors(ctx, () =>
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
    deleteFile(ctx:Context, filename:string): Promise<any>
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

    /**
     * Set the provider module for this adapter
     * @param providerModule provider module
     */
    setProvider(providerModule:any): void
    {
        this.provider = providerModule;
    }
};