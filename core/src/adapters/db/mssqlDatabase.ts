import { Context, NameValueMap, Condition, Join, CompoundCondition, SingleCondition } from "../../types";
import { Database } from "../../database";
import { conditionFactory } from "../../services/conditionFactory";
import { execService } from "../../services/execService";
import { helperService } from "../../services/helperService";
import { joinFactory } from "../../services/joinFactory";
import { MssqlQuery as Query } from "./mssqlQuery";

export class MssqlDatabase implements Database
{
    private pool:any;

    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    quickFind(ctx:Context, fields:string[], entity:string, conditionMap:NameValueMap): Promise<any>
    {
        const condition = conditionFactory.createCompound("&", []);
        for(const key in conditionMap)
        {
            if(!conditionMap.hasOwnProperty(key)) continue;
            condition.children.push(conditionFactory.createSingle(entity, key, "=", conditionMap[key]));
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
    select(ctx:Context, fields:string[], entity:string, condition:Condition, orderByField:string, skip:number, take:number,
        resolveFK:boolean, isFullMode:boolean): Promise<any>
    {
        const joins = resolveFK ? this.getJoins(ctx, fields, entity) : [];
        const query = new Query();
        const tableName = entity + "table";
        query.append("select ");
        for(let i=0; i<fields.length; i++)
        {
            const fieldName = fields[i];
            if(!isFullMode && fieldName.indexOf("richtext") >= 0)
                continue;
            query.append((i === 0 ? "": ", ") + "[" + entity + "table].[" + fieldName + "]");
        }
        for(let i=0; i<joins.length; i++)
        {
            query.append(", " + this.getSelectExpression(joins[i]));
        }
        query.append(" from [" + tableName + "]");
        for(let i=0; i<joins.length; i++)
        {
            query.append(" " + this.getJoinExpression(joins[i]));
        }
        query.append(" where ");
        this.appendWhereClause(query, condition);
        orderByField = decodeURIComponent(orderByField);
        if(orderByField.indexOf("~") === 0)
        {
            query.append(" order by [" + entity + "table].[" + orderByField.substring(1) + "] desc ");
        }
        else
        {
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
    findRecordById(ctx:Context, entity:string, recordId:string): Promise<any>
    {
        const fields = helperService.getFields(ctx, "read", entity);
        const condition = conditionFactory.createSingle(entity, "id", "=", recordId);

        return new Promise(async resolve =>
        {
            const rawResponseData = await this.select(ctx, fields, entity, condition, "id", 0, 1, true, false);
            const responseData = helperService.fixDataKeysAndTypes(ctx, rawResponseData[0], entity);
            resolve(responseData);
        }).catch(promiseErr => console.log(promiseErr));
    }

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entity Requested entity
     * @param condition Condition
     * @returns query results
     */
    count(ctx:Context, entity:string, condition:Condition): Promise<any>
    {
        const query = new Query();
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
     * @returns query results
     */
    insert(ctx:Context, entity:string, fieldNames:string[], fieldValues:string[]): Promise<any>
    {
        const query = new Query();
        const tableName = entity + "table";
        const fieldNamesStr = "[" + fieldNames.join("],[") + "]";
        query.append("insert into [" + tableName + "] (" + fieldNamesStr + ") values (");
        for(let i=0; i<fieldValues.length; i++)
        {
            query.append((i === 0 ? "" : ",") + "?", fieldValues[i]);
        }
        query.append("); select SCOPE_IDENTITY() as [identity];");
        return this.execute(ctx, query, raw => raw[0].identity);
    }

    /**
     * Update a record
     * @param ctx Request context
     * @param entity Requested entity
     * @param updateFields Fields to update
     * @param condition Update condition
     * @returns query results
     */
    update(ctx:Context, entity:string, updateFields:string[], condition:Condition): Promise<any>
    {
        const query = new Query();
        let isFirstSetClause = true;
        const tableName = entity + "table";
        query.append("update [" + tableName + "] set ");

        for(const fieldName in updateFields)
        {
            if(!updateFields.hasOwnProperty(fieldName)) 
                continue;
            query.append((isFirstSetClause ? "" : ",") + fieldName + "=?", updateFields[fieldName]);
            isFirstSetClause = false;
        }
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
    deleteRecord(ctx:Context, entity:string, id:string): Promise<any>
    {
        const query = new Query();
        const tableName = entity + "table";
        const condition = conditionFactory.createSingle(entity, "id", "=", id);
        query.append("delete from [" + tableName + "] where ");
        this.appendWhereClause(query, condition);
        return this.execute(ctx, query);
    }

    /**
     * Set the connection pool to be used by this adapter
     * @param connectionPool connection pool
     */
    setConnectionPool(connectionPool:any): void
    {
        this.pool = connectionPool;
    }

    /**
     * Get Join objects to resolve foreign keys
     * @param ctx Request context
     * @param fields Fields in the requested entity
     * @param entity Requested entity
     * @returns an array of Joins
     */
    private getJoins(ctx:Context, fields:string[], entity:string): Join[]
    {
        const joins = [];
        const ctxFields = ctx.config.entities[entity].fields;
        for(let f=0; f<fields.length; f++)
        {
            const fldName = fields[f];
            const fieldObj = ctxFields[fldName];
            if(fieldObj.foreignKey) 
            {
                joins.push(joinFactory.createForForeignKey(ctx, entity, fldName));
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
    private async execute(ctx:Context, query:Query, responseHandler?:((raw:any)=>any)): Promise<any>
    {
        await this.ensurePoolInitialized(ctx);
        const queryString = query.getQueryString();
        const queryParams = query.getQueryParams();
        console.log("-------------------------------------------------");
        console.log("Sending query to database:");
        console.log(queryString);
        console.log("Query parameters:");
        console.log(queryParams);

        const request = new this.pool.sql.Request(this.pool);
        for (const key in queryParams)
        {
            if (!queryParams.hasOwnProperty(key))
                continue;
            const paramValue = queryParams[key];
            if (typeof (paramValue) === "number" && Math.abs(paramValue) > 2147483647)
            {
                request.input(key, this.pool.sql.BigInt, paramValue);
            }
            else
            {
                request.input(key, paramValue);
            }
        }
        console.log("-------------------------------------------------");

        return new Promise(resolve =>
        {
            let responseData:any = null;
            request.query(queryString, (err:any, dbResponse:any) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    if (err)
                    {
                        resolve(responseData);
                        console.log(err);
                        execService.sendErrorResponse(ctx, "a07f", 500, "error while sending query to database");
                    }
                    else
                    {
                        responseData = dbResponse.recordset;
                        if(responseHandler)
                            responseData = responseHandler(responseData);
                        resolve(responseData);
                    }
                });
            });
        }).catch(promiseErr => console.log(promiseErr));
    }

    /**
     * Ensure the connection pool is initialized
     * @param ctx Request context
     */
    private ensurePoolInitialized(ctx:Context): Promise<any>
    {
        return new Promise(resolve =>
        {
            if(this.pool)
            {
                resolve();
                return;
            }
            const sql = require("mssql");
            this.pool = new sql.ConnectionPool(ctx.config.database.connectionString, (err:any) =>
            {
                execService.catchAllErrors(ctx, () =>
                {
                    if (err)
                    {
                        console.log(err);
                        execService.sendErrorResponse(ctx, "f8cb", 500, "error while connecting to database");
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
    private getJoinExpression (joinObj:Join): string
    {
        return "INNER JOIN [" + joinObj.e2 + "table] [" + joinObj.e2Alias + "] ON [" + joinObj.e1 + "table].[" + joinObj.e1JoinField + "] = [" + joinObj.e2Alias + "].[" + joinObj.e2JoinField + "]";
    }

    /**
     * Get a select expression for the given Join object
     * @param joinObj Join object
     * @returns a SELECT clause string
     */
    private getSelectExpression (joinObj:Join): string
    {
        let str = "";
        for (let i = 0; i < joinObj.e2SelectFields.length; i++)
        {
            str += (str === "" ? "" : ", ") + "[" + joinObj.e2Alias + "].[" + joinObj.e2SelectFields[i] + "] AS [" + joinObj.e2Alias + "_" + joinObj.e2SelectFields[i] + "]";
        }
        return str;
    }

    /**
     * Append where clause to the given query based on the specified condition
     * @param query Query object
     * @param condObj Condition object
     */
    private appendWhereClause(query:Query, condObj:Condition)
    {
        if (condObj instanceof SingleCondition)
        {
            if (condObj.fieldName === "1" && condObj.fieldValue === "1")
            {
                query.append("1=1");
            }
            else if (condObj.operator === "~")
            {
                query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] like ?", "%" + condObj.fieldValue + "%");
            }
            else if (typeof (condObj.fieldValue) === "string" && condObj.fieldValue.toLowerCase() === "null")
            {
                if (condObj.operator == "=")
                {
                    query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is null");
                }
                else
                {
                    query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is not null");
                }
            }
            else
            {
                query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "]" + condObj.operator + "?", condObj.fieldValue);
            }
        }
        else if(condObj instanceof CompoundCondition && condObj.children.length > 0)
        {
            query.append("(");
            for (let i = 0; i < condObj.children.length; i++)
            {
                const childCond = condObj.children[i];
                if (i > 0) query.append(condObj.operator === "&" ? " AND " : " OR ");
                this.appendWhereClause(query, childCond);
            }
            query.append(")");
        }
        else
        {
            query.append("1=1");
        }
    }
}
