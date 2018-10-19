// const Module = require("../module");

// /**
//  * A module to handle update operations
//  */
// module.exports = class UpdateHandler extends Module
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["auth", "helper", "conditionFactory", "db"];
//     }

//     /**
//      * Handle an update request
//      * @param {any} ctx Request context
//      * @param {any} requestBody Request body
//      * @param {any} recordId Record ID to update
//      */
//     execute (ctx, requestBody, recordId)
//     {
//         this.helper.onBeginWriteRequest(ctx, "update", this.db, recordId, requestBody, (record, requestBody) =>
//         {
//             const updateData = {};
//             const fields = this.helper.getFields(ctx, "update");
//             for(let i=0; i<fields.length; i++)
//             {
//                 const fieldName = fields[i];
//                 if(!requestBody.hasOwnProperty(fieldName)) continue;
//                 updateData[fieldName] = requestBody[fieldName];
//             }
//             if(Object.keys(updateData).length === 0)
//             {
//                 this.exec.throwError("582e", 400, "bad request");
//             }
//             if(ctx.entity === "user" && record.domain !== "local") 
//             {
//                 this.exec.throwError("511f", 400, "updating external user info is not supported");
//             }
//             const condition = this.conditionFactory.createSingle(ctx.entity, "id", "=", recordId);
//             this.db.update(ctx, ctx.entity, updateData, condition, (dbResponse) =>
//             {
//                 ctx.res.send(dbResponse);
//             });
//         });
//     }
// }