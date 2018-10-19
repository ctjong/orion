
// const path = require("path");
// let provider = null;

// /**
//  * A module to handle file upload/delete on local server storage
//  */
// module.exports = class LocalHostStorage
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
//         if(provider)
//             return;
//         provider = require("fs");
//     }

//     /**
//      * Upload a file to Azure Blob Storage
//      * @param {any} ctx Request context
//      * @param {any} req Request object
//      * @param {any} callback Callback function
//      */
//     uploadFile(ctx, req, callback)
//     {
//         const form = new (this.multiparty.Form)(
//         {
//             autoFiles: true,
//             uploadDir: ctx.config.storage.uploadPath
//         });
//         form.on('file', this.exec.cb(ctx, (name, file) =>
//         {
//             const tempPath = file.path;
//             const tempName = path.basename(tempPath);
//             const finalName = this.guid() + tempName.substring(tempName.lastIndexOf("."));
//             const finalPath = tempPath.replace(tempName, finalName);
//             provider.rename(tempPath, finalPath, this.exec.cb(ctx, (error) =>
//             {
//                 callback(error, finalName);
//             }));
//         }));
//         form.on('error', this.exec.cb(ctx, (err) =>
//         {
//             this.exec.sendErrorResponse(ctx, "8651", 400, "error while parsing form data");
//         }));
//         form.parse(req);
//     }

//     /**
//      * Delete a file from the storage
//      * @param {*} ctx Request context
//      * @param {*} filename File name to delete
//      * @param {*} callback Callback function
//      */
//     deleteFile(ctx, filename, callback)
//     {
//         const fullPath = ctx.config.storage.uploadPath + "/" + filename;
//         provider.unlink(fullPath, (error) =>
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
// };