import { IConfig, Context, IUploadFileResponse } from "../types";
import * as azureStorage from "azure-storage";
import { execService } from "../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import * as mime from "mime-types";
import { StorageCommandWrapper } from "./storageCommmandWrapper";
import { IStorageCommandWrapper } from "./iStorageCommandWrapper";
import { IStorageAdapter } from "./iStorageAdapter";

/**
 * Class that handles file upload/delete on Azure Blob Storage
 */
export class AzureStorageAdapter implements IStorageAdapter
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
            if(!config.storage.azureStorageConnectionString)
                throw "Missing azureStorageConnectionString in the config";
            this.wrapper = new StorageCommandWrapper();
            this.wrapper.setService(azureStorage.createBlobService(config.storage.azureStorageConnectionString));
        }
    }

    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     */
    uploadFileAsync(ctx:Context, req:any): Promise<IUploadFileResponse>
    {
        return new Promise(resolve =>
        {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)();
            form.on('part', (stream:any) =>
            {
                execService.catchAllErrorsAsync(ctx, async () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("ffce", 400, "submitted file is not a valid file");
                    const size = stream.byteCount - stream.byteOffset;
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    const error = await this.wrapper.azureUploadAsync(ctx.config.storage.azureStorageContainerName, name, stream, size, 
                    {
                        contentSettings: { contentType: mime.lookup(name) }
                    });
                    resolve({ error: error, name: name });
                });
            });
            form.on('progress', (bytesReceived, bytesExpected) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService.sendErrorResponse(ctx, "171d", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    execService.sendErrorResponse(ctx, "ead9", 400, "error while parsing form data");
                });
            });
            form.parse(req);
        });
    }

    /**
     * Delete a file from the storage
     * @param ctx Request context 
     * @param filename File name
     * @param callback Callback function
     */
    async deleteFileAsync(ctx:Context, filename:string): Promise<any>
    {
        return this.wrapper.azureDeleteAsync(ctx.config.storage.azureStorageContainerName, filename);
    }
}