// const Module = require("../module");

// /**
//  * A module to handle file upload operations
//  */
// module.exports = class CreateAssetHandler
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["storage", "helper", "db"];
//     }

//     /**
//      * Handle a create asset (file upload) request
//      * @param ctx Request context
//      * @param req Request object
//      */
//     execute(ctx, req)
//     {
//         if (!ctx.config.storage)
//             this.exec.throwError("e668", 500, "file upload is not supported for this site");
//         if(!ctx.userId) 
//             this.exec.throwError("4f53", 401, "anonymous upload is not supported");
//         this.helper.onBeginWriteRequest(ctx, "create", this.db, null, { "ownerid": ctx.userId }, (record, requestBody) =>
//         {
//             this.storage.uploadFile(ctx, req, (error, name) =>
//             {
//                 if (error)
//                 {
//                     this.exec.sendErrorResponse(ctx, "d2d0", 500, "error while uploading file to storage system");
//                 }
//                 else
//                 {
//                     this.db.insert(ctx, "asset", ["ownerid", "filename"], [ctx.userId, name], (insertedId) =>
//                     {
//                         ctx.res.send(insertedId.toString());
//                     });
//                 }
//             });
//         });
//     }
// };