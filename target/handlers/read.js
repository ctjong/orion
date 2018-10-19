// const Module = require("../module");
// /**
//  * A module to handle read operations
//  */
// module.exports = class ReadHandler extends Module
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["helper", "conditionFactory", "joinFactory", "db", "auth", "exec"];
//     }
//     /**
//      * Handle a read request
//      * @param {any} ctx Request context
//      * @param {any} requestParams Request parameters
//      * @param {any} isFullMode Whether to do the read in full mode (full mode = include rich text fields in response)
//      */
//     execute (ctx, requestParams, isFullMode)
//     {
//         // set owner role if the read operation is run in private mode
//         if (requestParams.accessType === "private")
//         {
//             // private read mode. add owner role directly, add ownerid condition later
//             if (!ctx.userId) this.exec.throwError("a058", 401, "Unauthorized");
//             ctx.userRoles.push("owner");
//         }
//         // verify that current user context is allowed to execute a read
//         this.helper.validateRoles(ctx, "read");
//         // get pagination and ordering info
//         const skip = isNaN(parseInt(requestParams.skip)) ? 0 : parseInt(requestParams.skip);
//         const take = isNaN(parseInt(requestParams.take)) ? 10 : parseInt(requestParams.take);
//         const orderByField = !requestParams.orderByField ? "id" : requestParams.orderByField;
//         // get condition
//         const configConditionStr = getConditionStringFromConfig(ctx, requestParams.accessType);
//         const condition = getConditionFromRequest(ctx, requestParams, this.conditionFactory, this.exec);
//         if(configConditionStr !== "") 
//         {
//             condition.children.push(this.conditionFactory.parse(ctx, configConditionStr));
//         }
//         // execute
//         const fields = this.helper.getFields(ctx, "read");
//         this.db.count(ctx, fields, ctx.entity, condition, true, (count) =>
//         {
//             this.db.select(ctx, fields, ctx.entity, condition, orderByField, skip, take, true, isFullMode, (dbResponse) =>
//             {
//                 for(let i=0; i<dbResponse.length; i++)
//                 {
//                     dbResponse[i] = this.helper.fixDataKeysAndTypes(ctx, dbResponse[i]);
//                 }
//                 ctx.res.json({"count": count, "items": dbResponse});
//             });
//         });
//     }
// }
// //----------------------------------------------
// // PRIVATE
// //----------------------------------------------
// /**
//  * Get condition string from config
//  * @param {any} ctx Request context
//  * @returns condition string
//  */
// const getConditionStringFromConfig = (ctx) =>
// {
//     const entityConfig = ctx.config.entities[ctx.entity];
//     if (!entityConfig.getReadCondition)
//         return "";
//     return entityConfig.getReadCondition(ctx.userRoles, ctx.userId);
// }
// /**
//  * Get Condition object from the request
//  * @param {any} ctx Request context
//  * @param {any} requestParams Request parameters
//  * @param {any} conditionFactory Condition factory
//  * @param {any} exec Exec module
//  * @returns Condition object
//  */
// const getConditionFromRequest = (ctx, requestParams, conditionFactory, exec) =>
// {
//     const isPrivate = requestParams.accessType === "private";
//     const condition = conditionFactory.createCompound("&", []);
//     if(!!requestParams.condition)
//     {
//         const conditionString = decodeURIComponent(requestParams.condition);
//         condition.children.push(conditionFactory.parse(ctx, conditionString));
//     }
//     else if(!!requestParams.id)
//     {
//         condition.children.push(conditionFactory.createSingle(ctx.entity, "id", "=", requestParams.id));
//     }
//     if(isPrivate)
//     {
//         const fieldName = ctx.entity === "user" ? "id" : "ownerid";
//         const val = parseInt(condition.getValue(fieldName));
//         if(!isNaN(val) && val !== ctx.userId)
//         {
//             exec.throwError("a19c", 401, "Unauthorized");
//         }
//         condition.children.push(conditionFactory.createSingle(ctx.entity, fieldName, "=", ctx.userId));
//     }
//     return condition;
// }
