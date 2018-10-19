// import Module from "../../module";
// let pool: any = null;
// /**
//  * A module for handling interaction with an MSSQL database
//  */
// export class MssqldbAdapter extends Module
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["helper", "conditionFactory", "joinFactory"];
//     }
//     /**
//      * Quick find a record based on the given condition
//      * @param {any} ctx Request context
//      * @param {any} fields Requested fields
//      * @param {any} entity Requested entity
//      * @param {any} conditionMap Search condition
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     quickFind(ctx: Context, fields, entity, conditionMap, successCb, completeCb)
//     {
//         const condition = this.conditionFactory.createCompound("&", []);
//         for(const key in conditionMap)
//         {
//             if(!conditionMap.hasOwnProperty(key)) continue;
//             condition.children.push(this.conditionFactory.createSingle(entity, key, "=", conditionMap[key]));
//         }
//         this.select(ctx, fields, entity, condition, "id", 0, 1, false, false, (responseArr) =>
//         {
//             successCb(responseArr[0]);
//         }, completeCb);
//     }
//     /**
//      * Find records that match the given condition
//      * @param {any} ctx Request context
//      * @param {any} fields Requested fields
//      * @param {any} entity Requested entity
//      * @param {any} condition Search condition
//      * @param {any} orderByField Field to order the results by
//      * @param {any} skip Number of matches to skip
//      * @param {any} take Number of matches to take
//      * @param {any} resolveFK Whether or not foreign keys should be resolved
//      * @param {any} isFullMode Whether or not result should be returned in full mode
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     select(ctx, fields, entity, condition, orderByField, skip, take, resolveFK, isFullMode, successCb, completeCb)
//     {
//         const joins = resolveFK ? getJoins(ctx, fields, entity) : [];
//         const query = new Query();
//         const tableName = entity + "table";
//         query.append("select ");
//         for(let i=0; i<fields.length; i++)
//         {
//             const fieldName = fields[i];
//             if(!isFullMode && fieldName.contains("richtext")) continue;
//             query.append((i === 0 ? "": ", ") + "[" + entity + "table].[" + fieldName + "]");
//         }
//         for(let i=0; i<joins.length; i++)
//         {
//             query.append(", " + getSelectExpression(joins[i]));
//         }
//         query.append(" from [" + tableName + "]");
//         for(let i=0; i<joins.length; i++)
//         {
//             query.append(" " + getJoinExpression(joins[i]));
//         }
//         query.append(" where ");
//         appendWhereClause(query, condition);
//         orderByField = decodeURIComponent(orderByField);
//         if(orderByField.indexOf("~") === 0)
//         {
//             query.append(" order by [" + entity + "table].[" + orderByField.substring(1) + "] desc ");
//         }
//         else
//         {
//             query.append(" order by [" + entity + "table].[" + orderByField + "] ");
//         }
//         query.append(" OFFSET (?) ROWS FETCH NEXT (?) ROWS ONLY", skip, take);
//         execute(ctx, query, successCb, completeCb);
//     }
//     /**
//      * Find a record that matches the given id
//      * @param {any} ctx Request context
//      * @param {any} entity Requested entity
//      * @param {any} recordId Id of record to find
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     findRecordById(ctx, entity, recordId, successCb, completeCb)
//     {
//         const fields = this.helper.getFields(ctx, "read", entity);
//         const condition = this.conditionFactory.createSingle(entity, "id", "=", recordId);
//         this.select(ctx, fields, entity, condition, "id", 0, 1, true, false, (responseArr) =>
//         {
//             const record = responseArr[0];
//             successCb(this.helper.fixDataKeysAndTypes(ctx, record, entity));
//         }, completeCb);
//     }
//     /**
//      * Count the number of records that match the given condition
//      * @param {any} ctx Request context
//      * @param {any} fields Requested fields
//      * @param {any} entity Requested entity
//      * @param {any} condition Condition
//      * @param {any} resolveFK Whether or not foreign keys should be resolved
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     count(ctx, fields, entity, condition, resolveFK, successCb, completeCb)
//     {
//         const joins = resolveFK ? getJoins(ctx, fields, entity) : [];
//         const query = new Query();
//         const tableName = entity + "table";
//         query.append("select count(*) from [" + tableName + "] where ");
//         appendWhereClause(query, condition);
//         execute(ctx, query, (dbResponse) =>
//         {
//             successCb(dbResponse[0][""]);
//         }, completeCb);
//     }
//     /**
//      * Insert a new record
//      * @param {any} ctx Request context
//      * @param {any} entity Requested entity
//      * @param {any} fieldNames New record field names
//      * @param {any} fieldValues New record field values
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     insert(ctx, entity, fieldNames, fieldValues, successCb, completeCb)
//     {
//         const query = new Query();
//         const tableName = entity + "table";
//         const fieldNamesStr = "[" + fieldNames.join("],[") + "]";
//         query.append("insert into [" + tableName + "] (" + fieldNamesStr + ") values (");
//         for(let i=0; i<fieldValues.length; i++)
//         {
//             query.append((i === 0 ? "" : ",") + "?", fieldValues[i]);
//         }
//         query.append("); select SCOPE_IDENTITY() as [identity];");
//         execute(ctx, query, (dbResponse) =>
//         {
//             successCb(dbResponse[0].identity);
//         }, completeCb);
//     }
//     /**
//      * Update a record
//      * @param {any} ctx Request context
//      * @param {any} entity Requested entity
//      * @param {any} updateFields Fields to update
//      * @param {any} condition Update condition
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     update(ctx, entity, updateFields, condition, successCb, completeCb)
//     {
//         const query = new Query();
//         let isFirstSetClause = true;
//         const tableName = entity + "table";
//         query.append("update [" + tableName + "] set ");
//         for(const fieldName in updateFields)
//         {
//             if(!updateFields.hasOwnProperty(fieldName)) 
//                 continue;
//             query.append((isFirstSetClause ? "" : ",") + fieldName + "=?", updateFields[fieldName]);
//             isFirstSetClause = false;
//         }
//         query.append(" where ");
//         appendWhereClause(query, condition);
//         execute(ctx, query, successCb, completeCb);
//     }
//     /**
//      * Delete a record from the database
//      * @param {any} ctx Request context
//      * @param {any} entity Requested entity
//      * @param {any} id Id of record to delete
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     deleteRecord(ctx, entity, id, successCb, completeCb)
//     {
//         const query = new Query();
//         const tableName = entity + "table";
//         const condition = this.conditionFactory.createSingle(entity, "id", "=", id);
//         query.append("delete from [" + tableName + "] where ");
//         appendWhereClause(query, condition);
//         execute(ctx, query, successCb, completeCb);
//     }
//     /**
//      * Set the connection pool to be used by this adapter
//      * @param {any} connectionPool connection pool
//      */
//     setConnectionPool(connectionPool)
//     {
//         pool = connectionPool;
//     }
//     /**
//      * Get Join objects to resolve foreign keys
//      * @param {any} ctx Request context
//      * @param {any} fields Fields in the requested entity
//      * @param {any} entity Requested entity
//      * @returns an array of Joins
//      */
//     private getJoins(ctx, fields, entity)
//     {
//         const joins = [];
//         const ctxFields = ctx.config.entities[entity].fields;
//         for(let f=0; f<fields.length; f++)
//         {
//             const fldName = fields[f];
//             const fieldObj = ctxFields[fldName];
//             if(!!fieldObj.foreignKey) 
//             {
//                 joins.push(this.joinFactory.createForForeignKey(ctx, entity, fldName));
//             }
//         }
//         return joins;
//     }
//     /**
//      * Execute a query
//      * @param {any} ctx Request context
//      * @param {any} query Query to execute
//      * @param {any} successCb Success callback
//      * @param {any} completeCb Complete callback
//      */
//     private execute(ctx, query, successCb, completeCb)
//     {
//         ensurePoolInitialized(ctx, function()
//         {
//             const queryString = query.getQueryString();
//             const queryParams = query.getQueryParams();
//             console.log("-------------------------------------------------");
//             console.log("Sending query to database:");
//             console.log(queryString);
//             console.log("Query parameters:");
//             console.log(queryParams);
//             const request = new pool.sql.Request(pool);
//             for (const key in queryParams)
//             {
//                 if (!queryParams.hasOwnProperty(key))
//                     continue;
//                 const paramValue = queryParams[key];
//                 if (typeof (paramValue) === "number" && Math.abs(paramValue) > 2147483647)
//                 {
//                     request.input(key, pool.sql.BigInt, paramValue);
//                 }
//                 else
//                 {
//                     request.input(key, paramValue);
//                 }
//             }
//             request.query(queryString, this.exec.cb(ctx, (err, dbResponse) =>
//             {
//                 if (err)
//                 {
//                     if (!!completeCb)
//                         completeCb();
//                     console.log(err);
//                     this.exec.sendErrorResponse(ctx, "a07f", 500, "error while sending query to database");
//                 }
//                 else
//                 {
//                     successCb(dbResponse.recordset);
//                     if (!!completeCb) 
//                         completeCb();
//                 }
//             }));
//             console.log("-------------------------------------------------");
//         });
//     }
//     /**
//      * Ensure the connection pool is initialized
//      * @param {any} ctx Request context
//      * @param {any} callback Callback function
//      */
//     private ensurePoolInitialized(ctx, callback) 
//     {
//         if(!!pool)
//         {
//             callback();
//             return;
//         }
//         const sql = require("mssql");
//         pool = new sql.ConnectionPool(ctx.config.database.connectionString, this.exec.cb(ctx, (err) =>
//         {
//             if (err)
//             {
//                 console.log(err);
//                 this.exec.sendErrorResponse(ctx, "f8cb", 500, "error while connecting to database");
//                 return;
//             }
//             pool.sql = sql;
//             callback();
//         }));
//     }
//     /**
//      * Get a join expression for the given Join object
//      * @param {any} joinObj Join object
//      * @returns a JOIN clause string
//      */
//     private getJoinExpression (joinObj)
//     {
//         return "INNER JOIN [" + joinObj.e2 + "table] [" + joinObj.e2Alias + "] ON [" + joinObj.e1 + "table].[" + joinObj.e1JoinField + "] = [" + joinObj.e2Alias + "].[" + joinObj.e2JoinField + "]";
//     }
//     /**
//      * Get a select expression for the given Join object
//      * @param {any} joinObj Join object
//      * @returns a SELECT clause string
//      */
//     private getSelectExpression (joinObj)
//     {
//         let str = "";
//         for (let i = 0; i < joinObj.e2SelectFields.length; i++)
//         {
//             str += (str === "" ? "" : ", ") + "[" + joinObj.e2Alias + "].[" + joinObj.e2SelectFields[i] + "] AS [" + joinObj.e2Alias + "_" + joinObj.e2SelectFields[i] + "]";
//         }
//         return str;
//     }
//     /**
//      * Append where clause to the given query based on the specified condition
//      * @param {any} query Query object
//      * @param {any} condObj Condition object
//      */
//     private appendWhereClause(query, condObj)
//     {
//         if (!condObj.children)
//         {
//             if (condObj.fieldName === "1" && condObj.fieldValue === "1")
//             {
//                 query.append("1=1");
//             }
//             else if (condObj.operator === "~")
//             {
//                 query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] like ?", "%" + condObj.fieldValue + "%");
//             }
//             else if (typeof (condObj.fieldValue) === "string" && condObj.fieldValue.toLowerCase() === "null")
//             {
//                 if (condObj.operator == "=")
//                 {
//                     query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is null");
//                 }
//                 else
//                 {
//                     query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is not null");
//                 }
//             }
//             else
//             {
//                 query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "]" + condObj.operator + "?", condObj.fieldValue);
//             }
//         }
//         else if(condObj.children.length > 0)
//         {
//             query.append("(");
//             for (let i = 0; i < condObj.children.length; i++)
//             {
//                 const childCond = condObj.children[i];
//                 if (i > 0) query.append(condObj.operator === "&" ? " AND " : " OR ");
//                 appendWhereClause(query, childCond);
//             }
//             query.append(")");
//         }
//         else
//         {
//             query.append("1=1");
//         }
//     }
// }
// /**
//  * A class representing an MSSQL query object
//  */
// class Query
// {
//     constructor()
//     {
//         this.paramsCounter = 0;
//         this.queryString = "";
//         this.queryParams = {};
//     }
//     /**
//      * Append the given string and params to the query
//      */
//     append(...args)
//     {
//         let str = args[0];
//         if (!str)
//             return;
//         if (args.length > 1)
//         {
//             let newStr = "";
//             let currentArgIndex = 1;
//             for (let i = 0; i < str.length; i++)
//             {
//                 if (str[i] !== "?")
//                 {
//                     newStr += str[i];
//                     continue;
//                 }
//                 newStr += "@value" + this.paramsCounter + " ";
//                 this.queryParams["value" + this.paramsCounter] = args[currentArgIndex];
//                 this.paramsCounter++;
//                 currentArgIndex++;
//             }
//             str = newStr;
//         }
//         this.queryString += str;
//     }
//     /**
//      * Get the query string
//      */
//     // Get the query string
//     getQueryString()
//     {
//         return this.queryString;
//     }
//     /**
//      * Get the query parameters
//      */
//     getQueryParams()
//     {
//         return this.queryParams;
//     }
// }
