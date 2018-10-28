"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const execService_1 = require("../../services/execService");
const multiparty = require("multiparty");
const guid = require("uuid");
/**
 * A module to handle file upload/delete on local server storage
 */
class LocalHostStorage {
    /**
     * Initialize the adapter
     * @param config config object
     */
    constructor(config) {
        this.provider = fs;
    }
    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     * @param callback Callback function
     */
    uploadFile(ctx, req) {
        return new Promise(resolve => {
            const form = new (multiparty.Form)({
                autoFiles: true,
                uploadDir: ctx.config.storage.uploadPath
            });
            form.on('file', (name, file) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    const tempPath = file.path;
                    const tempName = path.basename(tempPath);
                    const finalName = guid() + tempName.substring(tempName.lastIndexOf("."));
                    const finalPath = tempPath.replace(tempName, finalName);
                    this.provider.rename(tempPath, finalPath, (error) => {
                        execService_1.execService.catchAllErrors(ctx, () => {
                            resolve({ error: error, name: finalName });
                        });
                    });
                });
            });
            form.on('error', (err) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    execService_1.execService.sendErrorResponse(ctx, "8651", 400, "error while parsing form data");
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
    deleteFile(ctx, filename) {
        return new Promise(resolve => {
            const fullPath = ctx.config.storage.uploadPath + "/" + filename;
            this.provider.unlink(fullPath, (error) => {
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
exports.LocalHostStorage = LocalHostStorage;
;
