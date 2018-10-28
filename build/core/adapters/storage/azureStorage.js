"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const azureStorage = require("azure-storage");
const execService_1 = require("../../services/execService");
const multiparty = require("multiparty");
const guid = require("uuid");
const mime = require("mime-types");
/**
 * Class that handles file upload/delete on Azure Blob Storage
 */
class AzureStorage {
    /**
     * Initialize the adapter
     * @param config config object
     */
    constructor(config) {
        if (!config.storage.azureStorageConnectionString)
            throw "Missing azureStorageConnectionString in the config";
        this.provider = azureStorage.createBlobService(config.storage.azureStorageConnectionString);
    }
    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     */
    uploadFile(ctx, req) {
        return new Promise(resolve => {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)();
            form.on('part', (stream) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService_1.execService.throwError("ffce", 400, "submitted file is not a valid file");
                    const size = stream.byteCount - stream.byteOffset;
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    this.provider.createBlockBlobFromStream(ctx.config.storage.azureStorageContainerName, name, stream, size, {
                        contentSettings: { contentType: mime.lookup(name) }
                    }, (error) => {
                        execService_1.execService.catchAllErrors(ctx, () => {
                            resolve({ error: error, name: name });
                        });
                    });
                });
            });
            form.on('progress', (bytesReceived, bytesExpected) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    if (!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService_1.execService.sendErrorResponse(ctx, "171d", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    execService_1.execService.sendErrorResponse(ctx, "ead9", 400, "error while parsing form data");
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
    deleteFile(ctx, filename) {
        return new Promise(resolve => {
            this.provider.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, (error, response) => {
                resolve(error);
            });
        });
    }
    /**
     * Set the provider module for this adapter
     * @param providerModule provider module
     */
    setProvider(providerModule) {
        this.provider = providerModule;
    }
}
exports.AzureStorage = AzureStorage;
