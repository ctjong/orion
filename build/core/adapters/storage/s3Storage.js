"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const awsSdk = require("aws-sdk");
const execService_1 = require("../../services/execService");
const multiparty = require("multiparty");
const guid = require("uuid");
const mime = require("mime-types");
/**
 * A module to handle file upload/delete on Azure Blob Storage
 */
class S3Storage {
    /**
     * Initialize the adapter
     * @param config config object
     */
    constructor(config) {
        if (!config.storage.awsAccessKeyId || !config.storage.awsSecretAccessKey)
            throw "Missing awsAccessKeyId or awsSecretAccessKey in the config";
        this.provider = new awsSdk.S3({
            accessKeyId: config.storage.awsAccessKeyId,
            secretAccessKey: config.storage.awsSecretAccessKey
        });
    }
    /**
     * Upload a file to Azure Blob Storage
     * @param ctx Request context
     * @param req Request object
     * @param callback Callback function
     */
    uploadFile(ctx, req) {
        return new Promise(resolve => {
            let isFirstPartReceived = false;
            const form = new (multiparty.Form)({
                autoFields: true
            });
            form.on('part', (stream) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    isFirstPartReceived = true;
                    if (!stream.filename)
                        execService_1.execService.throwError("8dad", 400, "submitted file is not a valid file");
                    const name = guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
                    this.provider.upload({
                        Bucket: ctx.config.storage.s3Bucket,
                        Key: name,
                        ACL: 'public-read',
                        Body: stream,
                        ContentLength: stream.byteCount,
                        ContentType: mime.lookup(name)
                    }, (s3UploadErr, data) => {
                        execService_1.execService.catchAllErrors(ctx, () => {
                            resolve({ error: s3UploadErr, name: name });
                        });
                    });
                });
            });
            form.on('progress', (bytesReceived, bytesExpected) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    if (!isFirstPartReceived && bytesReceived >= bytesExpected)
                        execService_1.execService.sendErrorResponse(ctx, "49ef", 400, "error while parsing the first part");
                });
            });
            form.on('error', (err) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    execService_1.execService.sendErrorResponse(ctx, "a95a", 400, "error while parsing form data");
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
    deleteFile(ctx, filename) {
        return new Promise(resolve => {
            this.provider.deleteObject({
                Key: filename,
                Bucket: ctx.config.storage.s3Bucket
            }, (error, data) => {
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
exports.S3Storage = S3Storage;
