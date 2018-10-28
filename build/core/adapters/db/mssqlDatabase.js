"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const conditionFactory_1 = require("../../services/conditionFactory");
const execService_1 = require("../../services/execService");
const helperService_1 = require("../../services/helperService");
const joinFactory_1 = require("../../services/joinFactory");
const mssqlQuery_1 = require("./mssqlQuery");
class MssqlDatabase {
    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    quickFind(ctx, fields, entity, conditionMap) {
        const condition = conditionFactory_1.conditionFactory.createCompound("&", []);
        for (const key in conditionMap) {
            if (!conditionMap.hasOwnProperty(key))
                continue;
            condition.children.push(conditionFactory_1.conditionFactory.createSingle(entity, key, "=", conditionMap[key]));
        }
        return this.select(ctx, fields, entity, condition, "id", 0, 1, false, false);
    }
    /**
     * Find records that match the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param condition Search condition
     * @param orderByField Field to order the results by
     * @param skip Number of matches to skip
     * @param take Number of matches to take
     * @param resolveFK Whether or not foreign keys should be resolved
     * @param isFullMode Whether or not result should be returned in full mode
     * @returns query results
     */
    select(ctx, fields, entity, condition, orderByField, skip, take, resolveFK, isFullMode) {
        const joins = resolveFK ? this.getJoins(ctx, fields, entity) : [];
        const query = new mssqlQuery_1.MssqlQuery();
        const tableName = entity + "table";
        query.append("select ");
        for (let i = 0; i < fields.length; i++) {
            const fieldName = fields[i];
            if (!isFullMode && fieldName.indexOf("richtext") >= 0)
                continue;
            query.append((i === 0 ? "" : ", ") + "[" + entity + "table].[" + fieldName + "]");
        }
        for (let i = 0; i < joins.length; i++) {
            query.append(", " + this.getSelectExpression(joins[i]));
        }
        query.append(" from [" + tableName + "]");
        for (let i = 0; i < joins.length; i++) {
            query.append(" " + this.getJoinExpression(joins[i]));
        }
        query.append(" where ");
        this.appendWhereClause(query, condition);
        orderByField = decodeURIComponent(orderByField);
        if (orderByField.indexOf("~") === 0) {
            query.append(" order by [" + entity + "table].[" + orderByField.substring(1) + "] desc ");
        }
        else {
            query.append(" order by [" + entity + "table].[" + orderByField + "] ");
        }
        query.append(" OFFSET (?) ROWS FETCH NEXT (?) ROWS ONLY", skip.toString(), take.toString());
        return this.execute(ctx, query);
    }
    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entity Requested entity
     * @param recordId Id of record to find
     * @returns query results
     */
    findRecordById(ctx, entity, recordId) {
        const fields = helperService_1.helperService.getFields(ctx, "read", entity);
        const condition = conditionFactory_1.conditionFactory.createSingle(entity, "id", "=", recordId);
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const rawResponseData = yield this.select(ctx, fields, entity, condition, "id", 0, 1, true, false);
            const responseData = helperService_1.helperService.fixDataKeysAndTypes(ctx, rawResponseData[0], entity);
            resolve(responseData);
        })).catch(promiseErr => console.log(promiseErr));
    }
    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param condition Condition
     * @param resolveFK Whether we should resolve foreign keys
     * @returns query results
     */
    count(ctx, fields, entity, condition, resolveFK) {
        const query = new mssqlQuery_1.MssqlQuery();
        const tableName = entity + "table";
        query.append("select count(*) from [" + tableName + "] where ");
        this.appendWhereClause(query, condition);
        return this.execute(ctx, query, raw => raw[0][""]);
    }
    /**
     * Insert a new record
     * @param ctx Request context
     * @param entity Requested entity
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    insert(ctx, entity, fieldNames, fieldValues) {
        const query = new mssqlQuery_1.MssqlQuery();
        const tableName = entity + "table";
        const fieldNamesStr = "[" + fieldNames.join("],[") + "]";
        query.append("insert into [" + tableName + "] (" + fieldNamesStr + ") values (");
        for (let i = 0; i < fieldValues.length; i++) {
            query.append((i === 0 ? "" : ",") + "?", fieldValues[i]);
        }
        query.append("); select SCOPE_IDENTITY() as [identity];");
        return this.execute(ctx, query, raw => raw[0].identity);
    }
    /**
     * Update a record
     * @param ctx Request context
     * @param entity Requested entity
     * @param updateData Update data
     * @param condition Update condition
     * @returns query results
     */
    update(ctx, entity, updateData, condition) {
        const query = new mssqlQuery_1.MssqlQuery();
        let isFirstSetClause = true;
        const tableName = entity + "table";
        query.append("update [" + tableName + "] set ");
        Object.keys(updateData).forEach(fieldName => {
            query.append((isFirstSetClause ? "" : ",") + fieldName + "=?", updateData[fieldName]);
            isFirstSetClause = false;
        });
        query.append(" where ");
        this.appendWhereClause(query, condition);
        return this.execute(ctx, query);
    }
    /**
     * Delete a record from the database
     * @param ctx Request context
     * @param entity Requested entity
     * @param id Id of record to delete
     * @returns query results
     */
    deleteRecord(ctx, entity, id) {
        const query = new mssqlQuery_1.MssqlQuery();
        const tableName = entity + "table";
        const condition = conditionFactory_1.conditionFactory.createSingle(entity, "id", "=", id);
        query.append("delete from [" + tableName + "] where ");
        this.appendWhereClause(query, condition);
        return this.execute(ctx, query);
    }
    /**
     * Set the connection pool to be used by this adapter
     * @param connectionPool connection pool
     */
    setConnectionPool(connectionPool) {
        this.pool = connectionPool;
    }
    /**
     * Get Join objects to resolve foreign keys
     * @param ctx Request context
     * @param fields Fields in the requested entity
     * @param entity Requested entity
     * @returns an array of Joins
     */
    getJoins(ctx, fields, entity) {
        const joins = [];
        const ctxFields = ctx.config.entities[entity].fields;
        for (let f = 0; f < fields.length; f++) {
            const fldName = fields[f];
            const fieldObj = ctxFields[fldName];
            if (fieldObj.foreignKey) {
                joins.push(joinFactory_1.joinFactory.createForForeignKey(ctx, entity, fldName));
            }
        }
        return joins;
    }
    /**
     * Execute a query
     * @param ctx Request context
     * @param query Query to execute
     * @param responseHandler Response processor function
     * @returns query results
     */
    execute(ctx, query, responseHandler) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensurePoolInitialized(ctx);
            const queryString = query.getQueryString();
            const queryParams = query.getQueryParams();
            console.log("-------------------------------------------------");
            console.log("Sending query to database:");
            console.log(queryString);
            console.log("Query parameters:");
            console.log(queryParams);
            const request = new this.pool.sql.Request(this.pool);
            for (const key in queryParams) {
                if (!queryParams.hasOwnProperty(key))
                    continue;
                const paramValue = queryParams[key];
                if (typeof (paramValue) === "number" && Math.abs(paramValue) > 2147483647) {
                    request.input(key, this.pool.sql.BigInt, paramValue);
                }
                else {
                    request.input(key, paramValue);
                }
            }
            console.log("-------------------------------------------------");
            return new Promise(resolve => {
                let responseData = null;
                request.query(queryString, (err, dbResponse) => {
                    execService_1.execService.catchAllErrors(ctx, () => {
                        if (err) {
                            resolve(responseData);
                            console.log(err);
                            execService_1.execService.sendErrorResponse(ctx, "a07f", 500, "error while sending query to database");
                        }
                        else {
                            responseData = dbResponse.recordset;
                            if (responseHandler)
                                responseData = responseHandler(responseData);
                            resolve(responseData);
                        }
                    });
                });
            }).catch(promiseErr => console.log(promiseErr));
        });
    }
    /**
     * Ensure the connection pool is initialized
     * @param ctx Request context
     */
    ensurePoolInitialized(ctx) {
        return new Promise(resolve => {
            if (this.pool) {
                resolve();
                return;
            }
            const sql = require("mssql");
            this.pool = new sql.ConnectionPool(ctx.config.database.connectionString, (err) => {
                execService_1.execService.catchAllErrors(ctx, () => {
                    if (err) {
                        console.log(err);
                        execService_1.execService.sendErrorResponse(ctx, "f8cb", 500, "error while connecting to database");
                        return;
                    }
                    this.pool.sql = sql;
                });
            });
        }).catch(promiseErr => console.log(promiseErr));
    }
    /**
     * Get a join expression for the given Join object
     * @param joinObj Join object
     * @returns a JOIN clause string
     */
    getJoinExpression(joinObj) {
        return "INNER JOIN [" + joinObj.e2 + "table] [" + joinObj.e2Alias + "] ON [" + joinObj.e1 + "table].[" + joinObj.e1JoinField + "] = [" + joinObj.e2Alias + "].[" + joinObj.e2JoinField + "]";
    }
    /**
     * Get a select expression for the given Join object
     * @param joinObj Join object
     * @returns a SELECT clause string
     */
    getSelectExpression(joinObj) {
        let str = "";
        for (let i = 0; i < joinObj.e2SelectFields.length; i++) {
            str += (str === "" ? "" : ", ") + "[" + joinObj.e2Alias + "].[" + joinObj.e2SelectFields[i] + "] AS [" + joinObj.e2Alias + "_" + joinObj.e2SelectFields[i] + "]";
        }
        return str;
    }
    /**
     * Append where clause to the given query based on the specified condition
     * @param query Query object
     * @param condObj Condition object
     */
    appendWhereClause(query, condObj) {
        if (condObj instanceof types_1.SingleCondition) {
            if (condObj.fieldName === "1" && condObj.fieldValue === "1") {
                query.append("1=1");
            }
            else if (condObj.operator === "~") {
                query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] like ?", "%" + condObj.fieldValue + "%");
            }
            else if (typeof (condObj.fieldValue) === "string" && condObj.fieldValue.toLowerCase() === "null") {
                if (condObj.operator == "=") {
                    query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is null");
                }
                else {
                    query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is not null");
                }
            }
            else {
                query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "]" + condObj.operator + "?", condObj.fieldValue);
            }
        }
        else if (condObj instanceof types_1.CompoundCondition && condObj.children.length > 0) {
            query.append("(");
            for (let i = 0; i < condObj.children.length; i++) {
                const childCond = condObj.children[i];
                if (i > 0)
                    query.append(condObj.operator === "&" ? " AND " : " OR ");
                this.appendWhereClause(query, childCond);
            }
            query.append(")");
        }
        else {
            query.append("1=1");
        }
    }
}
exports.MssqlDatabase = MssqlDatabase;
