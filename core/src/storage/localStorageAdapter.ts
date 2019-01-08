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
    private wrapper: IStorageCommandWrapper;

    /**
     * Initialize the adapter
     * @param config config object
     * @param wrapper optional commmand wrapper module
     */
    constructor(config: IConfig, wrapper?: IStorageCommandWrapper)
    {
        if (wrapper)
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
    uploadFileAsync(ctx: Context, req: any): Promise<IUploadFileResponse>
    {
        return new Promise(resolve =>
        {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)();
            form.on('part', (stream: any) =>
            {
                execService.catchAllErrorsAsync(ctx, async () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("gouw", 400, "submitted file is not a valid file");
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    const error = await this.wrapper.localUploadAsync(name, stream, ctx.config.storage.uploadPath);
                    resolve({ error: error, name: name });
                });
            });
            form.on('progress', (bytesReceived, bytesExpected) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    if (!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService.sendErrorResponse(ctx, "odq8", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    execService.sendErrorResponse(ctx, "8651", 400, `error while parsing form data: ${err}`);
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
    deleteFileAsync(ctx: Context, filename: string): Promise<any>
    {
        const fullPath = ctx.config.storage.uploadPath + "/" + filename;
        return this.wrapper.localDeleteAsync(fullPath);
    }
};