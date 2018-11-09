import { IConfig, Context, IUploadFileResponse } from "../types";
import * as azureStorage from "azure-storage";
import { execService } from "../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import * as mime from "mime-types";

/**
 * Class that handles file upload/delete on Azure Blob Storage
 */
export class AzureStorageAdapter
{
    private wrapper:any;

    /**
     * Initialize the adapter
     * @param config config object
     * @param wrapper optional wrapper module
     */
    constructor(config:IConfig, wrapper?:any)
    {
        if(wrapper)
            this.wrapper = wrapper;
        else
        {
            if(!config.storage.azureStorageConnectionString)
                throw "Missing azureStorageConnectionString in the config";
            this.wrapper = azureStorage.createBlobService(config.storage.azureStorageConnectionString);
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
                execService.catchAllErrorsAsync(ctx, () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("ffce", 400, "submitted file is not a valid file");
                    const size = stream.byteCount - stream.byteOffset;
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    this.wrapper.createBlockBlobFromStream(ctx.config.storage.azureStorageContainerName, name, stream, size, 
                    {
                        contentSettings: { contentType: mime.lookup(name) }
                    },
                    (error:any) =>
                    {
                        execService.catchAllErrorsAsync(ctx, () =>
                        {
                            resolve({ error: error, name: name });
                        });
                    });
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
    deleteFileAsync(ctx:Context, filename:string): Promise<any>
    {
        return new Promise(resolve =>
        {
            this.wrapper.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, (error:any, response:any) =>
            {
                resolve(error);
            });
        });
    }
}