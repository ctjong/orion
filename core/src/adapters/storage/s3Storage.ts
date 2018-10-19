
// let provider = null;

// /**
//  * A module to handle file upload/delete on Azure Blob Storage
//  */
// module.exports = class S3Storage
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
//         if(provider || !config.storage.awsAccessKeyId || !config.storage.awsSecretAccessKey)
//             return;
//         const AWS = require("aws-sdk");
//         provider = new AWS.S3(
//         { 
//             accessKeyId: config.storage.awsAccessKeyId, 
//             secretAccessKey: config.storage.awsSecretAccessKey
//         });
//     }

//     /**
//      * Upload a file to Azure Blob Storage
//      * @param {any} ctx Request context
//      * @param {any} req Request object
//      * @param {any} callback Callback function
//      */
//     uploadFile(ctx, req, callback)
//     {
//         let isFirstPartReceived = false;
//         const form = new (this.multiparty.Form)(
//         {
//             autoFields: true
//         });
//         form.on('part', this.exec.cb(ctx, (stream) => 
//         {
//             isFirstPartReceived = true;
//             if (!stream.filename)
//                 this.exec.throwError("8dad", 400, "submitted file is not a valid file");
//             const name = this.guid() + stream.filename.substring(stream.filename.lastIndexOf("."));
//             provider.upload(
//             {
//                 Bucket: ctx.config.storage.s3Bucket,
//                 Key: name,
//                 ACL: 'public-read',
//                 Body: stream,
//                 ContentLength: stream.byteCount,
//                 ContentType: this.mime.lookup(name)
//             },
//             this.exec.cb(ctx, (s3UploadErr, data) =>
//             {
//                 callback(s3UploadErr, name);
//             }));
//         }));
//         form.on('progress', this.exec.cb(ctx, (bytesReceived, bytesExpected) =>
//         {
//             if(!isFirstPartReceived && bytesReceived >= bytesExpected)
//                 this.exec.sendErrorResponse(ctx, "49ef", 400, "error while parsing the first part");
//         }));
//         form.on('error', this.exec.cb(ctx, (err) =>
//         {
//             this.exec.sendErrorResponse(ctx, "a95a", 400, "error while parsing form data");
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
//         provider.deleteObject(
//         {
//             Key: filename,
//             Bucket: ctx.config.storage.s3Bucket
//         },
//         (error, data) =>
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