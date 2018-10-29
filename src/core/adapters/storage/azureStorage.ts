import { Config, Context, UploadFileResponse } from "../../types";
import * as azureStorage from "azure-storage";
import { execService } from "../../services/execService";
import * as multiparty from "multiparty";
import * as guid from "uuid";
import * as mime from "mime-types";

/**
 * Class that handles file upload/delete on Azure Blob Storage
 */
export class AzureStorage
{
    provider:any;

    /**
     * Initialize the adapter
     * @param config config object
     */
    constructor(config:Config)
    {
        if(!config.storage.azureStorageConnectionString)
            throw "Missing azureStorageConnectionString in the config";
        this.provider = azureStorage.createBlobService(config.storage.azureStorageConnectionString);
    }

    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     */
    uploadFile(ctx:Context, req:any): Promise<UploadFileResponse>
    {
        return new Promise(resolve =>
        {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)();
            form.on('part', (stream:any) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService.throwError("ffce", 400, "submitted file is not a valid file");
                    const size = stream.byteCount - stream.byteOffset;
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    this.provider.createBlockBlobFromStream(ctx.config.storage.azureStorageContainerName, name, stream, size, 
                    {
                        contentSettings: { contentType: mime.lookup(name) }
                    },
                    (error:any) =>
                    {
                        execService.catchAllErrors(ctx, () =>
                        {
                            resolve({ error: error, name: name });
                        });
                    });
                });
            });
            form.on('progress', (bytesReceived, bytesExpected) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    if(!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService.sendErrorResponse(ctx, "171d", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err) =>
            {
                execService.catchAllErrors(ctx, () =>
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
    deleteFile(ctx:Context, filename:string): Promise<any>
    {
        return new Promise(resolve =>
        {
            this.provider.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, (error:any, response:any) =>
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
}