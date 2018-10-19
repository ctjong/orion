// const Module = require("../module");

// /**
//  * A module containing utility/helper functions
//  */
// module.exports = class HelperService
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return [];
//     }

//     /**
//      * Get a list of fields that are accessible from the given entity for the
//      * specified action.
//      * @param {any} ctx Request context
//      * @param {any} action Action name
//      * @param {any} entity Entity name
//      * @returns an array of field names
//      */
//     getFields (ctx, action, entity)
//     {
//         if(!entity) entity = ctx.entity;
//         const fields = ctx.config.entities[entity].fields;
//         const allowedFields = [];
//         for(const fieldName in fields)
//         {
//             if(!fields.hasOwnProperty(fieldName))
//                 continue;
//             if(!(action === "read" && fields[fieldName].type === "secret") &&
//                 !(action === "update" && !fields[fieldName].isEditable))
//             {
//                 allowedFields.push(fieldName);
//             }
//         }
//         return allowedFields;
//     }

//     /**
//      * Fix the key name and type of each item in the given data object
//      * @param {any} ctx Request context
//      * @param {any} data Data object
//      * @param {any} entity Entity name
//      * @returns fixed data object
//      */
//     fixDataKeysAndTypes (ctx, data, entity)
//     {
//         if(!data)
//             return data;
//         const newData = {};
//         for(const key in data)
//         {
//             if(!data.hasOwnProperty(key))
//                 continue;
//             if(key.contains("_"))
//             {
//                 const keyParts = key.split("_");
//                 const outerKey = keyParts[0].toLowerCase();
//                 const innerKey = keyParts[1].toLowerCase();
//                 if(!newData[outerKey]) newData[outerKey] = {};
//                 newData[outerKey][innerKey] = data[key];
//             }
//             else
//             {
//                 newData[key.toLowerCase()] = data[key];
//             }
//         }
//         if(!entity) 
//             entity = ctx.entity;
//         this.fixDataTypes(ctx, entity, newData);
//         for(const newKey in newData)
//         {
//             if(!newData.hasOwnProperty(newKey) || !newData[newKey] || typeof(newData[newKey]) !== "object")
//                 continue;
//             this.fixDataTypes(ctx, entity, newData[newKey]);
//         }
//         return newData;
//     }

//     /**
//      * To be invoked at the beginning of a write request (create/update/delete).
//      * This will check if an action is permitted, given the context and target record.
//      * Also resolve any foreign key that exists in the request body.
//      * Throws an exception on failure.
//      * @param {any} ctx Request context
//      * @param {any} action Action name
//      * @param {any} db Database module
//      * @param {any} recordId Record ID
//      * @param {any} requestBody Requset body
//      * @param {any} callback Callback function
//      */
//     onBeginWriteRequest (ctx, action, db, recordId, requestBody, callback)
//     {
//         requestBody = this.fixDataKeysAndTypes(ctx, requestBody);
//         const isWriteAllowedFn = ctx.config.entities[ctx.entity].isWriteAllowed;
//         if(action === "create")
//         {
//             this.validateRoles(ctx, "create");
//             this.resolveForeignKeys(ctx, requestBody, db, (requestBody) =>
//             {
//                 if (!!isWriteAllowedFn && !isWriteAllowedFn(action, ctx.userRoles, ctx.userId, null, requestBody))
//                     this.exec.throwError("c75f", 400, "bad create request. operation not allowed.");
//                 callback(null, requestBody);
//             });
//         }
//         else
//         {
//             db.findRecordById(ctx, ctx.entity, recordId, (record) =>
//             {
//                 if(!record)
//                     this.exec.throwError("7e13", 400, "record not found with id " + recordId);
//                 record = this.fixDataKeysAndTypes(ctx, record);
//                 if((ctx.entity === "user" && ctx.userId === record.id) || (ctx.entity !== "user" && ctx.userId === record.ownerid))
//                 {
//                     ctx.userRoles.push("owner");
//                 }
//                 this.validateRoles(ctx, action);
//                 if (!!isWriteAllowedFn && !isWriteAllowedFn(action, ctx.userRoles, ctx.userId, record, requestBody))
//                     this.exec.throwError("29c8", 400, "bad " + action + " request. operation not allowed.");
//                 callback(record, requestBody);
//             });
//         }
//     }

//     /**
//      * Check if the given action is permitted, given the current user roles context.
//      * Throws an exception on failure.
//      * @param {any} ctx Request context
//      * @param {any} action Action name
//      */
//     validateRoles(ctx, action)
//     {
//         if (!ctx.config.entities[ctx.entity].allowedRoles[action].containsAny(ctx.userRoles))
//             this.exec.throwError("c327", 401, "Unauthorized");
//     }

//     /**
//      * Fix the type of each item in the given data object
//      * @param {any} ctx Request context
//      * @param {any} entity Entity name
//      * @param {any} dataObj Data object
//      * @returns fixed data object
//      */
//     fixDataTypes(ctx, entity, dataObj)
//     {
//         const fields = ctx.config.entities[entity].fields;
//         for(const fieldName in fields)
//         {
//             if(!fields.hasOwnProperty(fieldName))
//                 continue;
//             const fieldType = fields[fieldName].type;
//             if(dataObj[fieldName] === null || typeof(dataObj[fieldName]) === "undefined")
//                 continue;
//             if(fieldType === "int")
//             {
//                 dataObj[fieldName] = parseInt(dataObj[fieldName]);
//             }
//             else if(fieldType === "float")
//             {
//                 dataObj[fieldName] = parseFloat(dataObj[fieldName]);
//             }
//         }
//     }


//     /**
//      * Resolve the foreign keys in the given request body
//      * @param {any} ctx Request context
//      * @param {any} requestBody Request body
//      * @param {any} db Database module
//      * @param {any} callback Callback function
//      */
//     resolveForeignKeys(ctx, requestBody, db, callback)
//     {
//         const fields = ctx.config.entities[ctx.entity].fields;
//         const fieldNamesToResolve = [];
//         for(const fieldName in fields)
//         {
//             if(!fields.hasOwnProperty(fieldName) || !fields[fieldName].foreignKey || !requestBody[fieldName])
//                 continue;
//             fieldNamesToResolve.push(fieldName);
//         }
//         if(fieldNamesToResolve.length === 0)
//         {
//             callback(requestBody);
//         }
//         else
//         {
//             const op = { active: fieldNamesToResolve.length, isCallbackCalled: false };
//             for(let i=0; i<fieldNamesToResolve.length; i++)
//             {
//                 const fieldName = fieldNamesToResolve[i];
//                 this.resolveForeignKey(ctx, op, requestBody, fieldName, fields[fieldName].foreignKey, db, callback);
//             }
//         }
//     }

//     /**
//      * Resolve a foreign key field in the given request body
//      * @param {any} ctx Request context
//      * @param {any} op Foreign key resolve operation object
//      * @param {any} requestBody Request body
//      * @param {any} fieldName Field name
//      * @param {any} fk Foreign key object
//      * @param {any} db Database module
//      * @param {any} callback Callback function
//      */
//     resolveForeignKey(ctx, op, requestBody, fieldName, fk, db, callback)
//     {
//         db.findRecordById(ctx, fk.foreignEntity, requestBody[fieldName], (record) =>
//         {
//             op.active--;
//             requestBody[fk.resolvedKeyName] = this.fixDataKeysAndTypes(ctx, record);
//             if(op.active <= 0 && !op.isCallbackCalled)
//             {
//                 callback(requestBody);
//                 op.isCallbackCalled = true;
//             }
//         });
//     }
// }