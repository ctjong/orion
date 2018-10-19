
// let provider = null;

// /**
//  * A module to handle file upload/delete on Azure Blob Storage
//  */
// module.exports = class AzureStorage
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["multiparty", "guid", "mime", "helper", "db"];
//     }

//     /**
//      * Initialize the adapter
//      */
//     initialize(config)
//     {
//         if(!!provider || !config.storage.azureStorageConnectionString)
//             return;
//         const azure = require("azure-storage");
//         provider = azure.createBlobService(config.storage.azureStorageConnectionString);
//     }

//     /**
//      * Upload a file to Azure Blob Storage
//      * @param {any} ctx Request context
//      * @param {any} req Request object
//      * @param {any} callback Callback function
//      */
//     uploadFile(ctx, req, callback)
//     {
//         const isFirstPartReceived = false;
//         const form = new (this.multiparty.Form)();
//         form.on('part', this.exec.cb(ctx, (stream) =>
//         {
//             isFirstPartReceived = true;
//             if (!stream.filename)
//                 this.exec.throwError("ffce", 400, "submitted file is not a valid file");
//             const size = stream.byteCount - stream.byteOffset;
//             const name = this.guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
//             provider.createBlockBlobFromStream(ctx.config.storage.azureStorageContainerName, name, stream, size, 
//             {
//                 contentSettings: { contentType: this.mime.lookup(name) }
//             },
//             this.exec.cb(ctx, (error) =>
//             {
//                 callback(error, name);
//             }));
//         }));
//         form.on('progress', this.exec.cb(ctx, (bytesReceived, bytesExpected) =>
//         {
//             if(!isFirstPartReceived && bytesReceived >= bytesExpected)
//                 this.exec.sendErrorResponse(ctx, "171d", 400, "error while parsing the first part");
//         }));
//         form.on('error', this.exec.cb(ctx, (err) =>
//         {
//             this.exec.sendErrorResponse(ctx, "ead9", 400, "error while parsing form data");
//         }));
//         form.parse(req);
//     }

//     /**
//      * Delete a file from the storage
//      * @param {*} ctx Request context 
//      * @param {*} filename File name
//      * @param {*} callback Callback function
//      */
//     deleteFile(ctx, filename, callback)
//     {
//         provider.deleteBlob(ctx.config.storage.azureStorageContainerName, filename, (error, response) =>
//         {
//             callback(error);
//         });
//     }

//     /**
//      * Set the provider module for this adapter
//      * @param {any} providerModule provider module
//      */
//     setProvider(providerModule)
//     {
//         provider = providerModule;
//     }
// }