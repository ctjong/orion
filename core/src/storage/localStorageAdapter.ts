import * as path from "path";
import { IConfig, Context, IUploadFileResponse } from "../types";
import { execService } from "../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import { IStorageCommandWrapper } from "./iStorageCommandWrapper";
import { StorageCommandWrapper } from "./storageCommmandWrapper";
import { IStorageAdapter } from "./iStorageAdapter";

/**
 * A module to handle file upload/delete on local server storage
 */
export class LocalStorageAdapter implements IStorageAdapter
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
            this.wrapper = new StorageCommandWrapper();
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
                execService.catchAllErrorsAsync(ctx, async () =>
                {
                    const tempPath = file.path;
                    const tempName = path.basename(tempPath);
                    const finalName = guid() + tempName.substring(tempName.lastIndexOf("."));
                    const finalPath = tempPath.replace(tempName, finalName);
                    const error = await this.wrapper.localRenameAsync(tempPath, finalPath);
                    resolve({ error: error, name: finalName });
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
        const fullPath = ctx.config.storage.uploadPath + "/" + filename;
        return this.wrapper.localUnlinkAsync(fullPath);
    }
};