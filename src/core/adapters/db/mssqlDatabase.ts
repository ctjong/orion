import { Context, INameValueMap, ICondition, Join, CompoundCondition, SingleCondition, IConfig } from "../../types";
import { conditionFactory } from "../../services/conditionFactory";
import { execService } from "../../services/execService";
import { helperService } from "../../services/helperService";
import { joinFactory } from "../../services/joinFactory";
import { MssqlQuery as Query } from "./mssqlQuery";
import * as mssql from "mssql";

export class MssqlDatabase 
{
    private pool: any;

    /**
     * Construct an MSSQL database adapter
     * @param config configuration object
     * @param pool optional connection pool module
     */
    constructor(config: IConfig, pool?: any)
    {
        if (pool)
            this.pool = pool;
        else
        {
            this.pool = new mssql.ConnectionPool(config.database.connectionString, (err: any) =>
            {
                if (err)
                    throw "error while connecting to database";
                this.pool.sql = mssql;
            });
        }
    }

    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    quickFindAsync(ctx: Context, fields: string[], entity: string, conditionMap: INameValueMap): Promise<any>
    {
        const condition = conditionFactory.createCompound("&", []);
        for (const key in conditionMap)
        {
            if (!conditionMap.hasOwnProperty(key)) continue;
            condition.children.push(conditionFactory.createSingle(entity, key, "=", conditionMap[key]));
        }
        return this.selectAsync(ctx, fields, entity, condition, "id", 0, 1, false, false);
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
    selectAsync(ctx: Context, fields: string[], entity: string, condition: ICondition, orderByField: string, skip: number, take: number,
        resolveFK: boolean, isFullMode: boolean): Promise<any>
    {
        if (fields.length === 0)
            return null;
        const joins = resolveFK ? this.getJoins(ctx, fields, entity) : [];
        const query = new Query();
        const tableName = entity + "table";

        const fieldsToSelect: string[] = [];
        fields.forEach(fieldName =>
        {
            if (isFullMode || fieldName.indexOf("richtext") === 0)
                fieldsToSelect.push(fieldName);
        });

        query.append(`select [${entity}table].[${fieldsToSelect[0]}]`);
        for (let i = 1; i < fieldsToSelect.length; i++)
            query.append(`, [${entity}table].[${fieldsToSelect[i]}]`);
        for (let i = 0; i < joins.length; i++)
            query.append(`, ${this.getSelectExpression(joins[i])}`);
        query.append(` from [${tableName}]`);
        for (let i = 0; i < joins.length; i++)
            query.append(` ${this.getJoinExpression(joins[i])}`);
        query.append(" where ");
        this.appendWhereClause(query, condition);
        orderByField = decodeURIComponent(orderByField);
        if (orderByField.indexOf("~") === 0)
            query.append(` order by [${entity}table].[${orderByField.substring(1)}] desc `);
        else
            query.append(` order by [${entity}table].[${orderByField}] `);
        query.append(" OFFSET (?) ROWS FETCH NEXT (?) ROWS ONLY", skip.toString(), take.toString());

        return this.executeAsync(ctx, query);
    }

    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entity Requested entity
     * @param recordId Id of record to find
     * @returns query results
     */
    async findRecordByIdAsync(ctx: Context, entity: string, recordId: string): Promise<any>
    {
        const fields = helperService.getFields(ctx, "read", entity);
        const condition = conditionFactory.createSingle(entity, "id", "=", recordId);

        const rawResponseData = await this.selectAsync(ctx, fields, entity, condition, "id", 0, 1, true, false);
        const responseData = helperService.fixDataKeysAndTypes(ctx, rawResponseData[0], entity);
        return responseData;
    }

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entity Requested entity
     * @param condition Condition object
     * @returns query results
     */
    async countAsync(ctx: Context, entity: string, condition: ICondition): Promise<any>
    {
        const query = new Query();
        const tableName = `${entity}table`;
        query.append(`select count(*) from [${tableName}] where `);
        this.appendWhereClause(query, condition);
        const response = await this.executeAsync(ctx, query);
        return response[0][""];
    }

    /**
     * Insert a new record
     * @param ctx Request context
     * @param entity Requested entity
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    async insertAsync(ctx: Context, entity: string, fieldNames: string[], fieldValues: string[]): Promise<any>
    {
        if (fieldValues.length === 0)
            return null;
        const query = new Query();
        const tableName = `${entity}table`;
        const fieldNamesStr = `[${fieldNames.join("],[")}]`;

        query.append(`insert into [${tableName}] (${fieldNamesStr}) values (`);
        query.append("?", fieldValues[0]);
        for (let i = 1; i < fieldValues.length; i++)
            query.append(",?", fieldValues[i]);
        query.append("); select SCOPE_IDENTITY() as [identity];");

        const response = await this.executeAsync(ctx, query);
        return response[0].identity;
    }

    /**
     * Update a record
     * @param ctx Request context
     * @param entity Requested entity
     * @param updateData Update data
     * @param condition Update condition
     * @returns query results
     */
    updateAsync(ctx: Context, entity: string, updateData: INameValueMap, condition: ICondition): Promise<any>
    {
        const query = new Query();
        let isFirstSetClause = true;
        const tableName = `${entity}table`;
        query.append(`update [${tableName}] set `);
        Object.keys(updateData).forEach(fieldName =>
        {
            query.append(`${isFirstSetClause ? "" : ","}${fieldName}=?`, updateData[fieldName]);
            isFirstSetClause = false;
        });
        query.append(" where ");
        this.appendWhereClause(query, condition);
        return this.executeAsync(ctx, query);
    }

    /**
     * Delete a record from the database
     * @param ctx Request context
     * @param entity Requested entity
     * @param id Id of record to delete
     * @returns query results
     */
    deleteRecordAsync(ctx: Context, entity: string, id: string): Promise<any>
    {
        const query = new Query();
        const tableName = `${entity}table`;
        const condition = conditionFactory.createSingle(entity, "id", "=", id);
        query.append("delete from [" + tableName + "] where ");
        this.appendWhereClause(query, condition);
        return this.executeAsync(ctx, query);
    }

    /**
     * Get Join objects to resolve foreign keys
     * @param ctx Request context
     * @param fields Fields in the requested entity
     * @param entity Requested entity
     * @returns an array of Joins
     */
    private getJoins(ctx: Context, fields: string[], entity: string): Join[]
    {
        const joins = [];
        const ctxFields = ctx.config.entities[entity].fields;
        for (let f = 0; f < fields.length; f++)
        {
            const fldName = fields[f];
            const fieldObj = ctxFields[fldName];
            if (fieldObj.foreignKey) 
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
     * @returns query results
     */
    private executeAsync(ctx: Context, query: Query): Promise<any>
    {
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
            let responseData: any = null;
            request.query(queryString, (err: any, dbResponse: any) =>
            {
                execService.catchAllErrorsAsync(ctx, () =>
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
                        resolve(responseData);
                    }
                });
            });
        });
    }


    /**
     * Get a join expression for the given Join object
     * @param joinObj Join object
     * @returns a JOIN clause string
     */
    private getJoinExpression(joinObj: Join): string
    {
        return "INNER JOIN [" + joinObj.e2 + "table] [" + joinObj.e2Alias + "] ON [" + joinObj.e1 + "table].[" + joinObj.e1JoinField + "] = [" + joinObj.e2Alias + "].[" + joinObj.e2JoinField + "]";
    }

    /**
     * Get a select expression for the given Join object
     * @param joinObj Join object
     * @returns a SELECT clause string
     */
    private getSelectExpression(joinObj: Join): string
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
    private appendWhereClause(query: Query, condObj: ICondition): void
    {
        if (!condObj.isCompound)
        {
            const singleCond:SingleCondition = condObj as SingleCondition;
            if (singleCond.fieldName === "1" && singleCond.fieldValue === "1")
            {
                query.append("1=1");
            }
            else if (singleCond.operator === "~")
            {
                query.append("[" + singleCond.entityName + "table].[" + singleCond.fieldName + "] like ?", "%" + singleCond.fieldValue + "%");
            }
            else if (typeof (singleCond.fieldValue) === "string" && singleCond.fieldValue.toLowerCase() === "null")
            {
                if (singleCond.operator == "=")
                {
                    query.append("[" + singleCond.entityName + "table].[" + singleCond.fieldName + "] is null");
                }
                else
                {
                    query.append("[" + singleCond.entityName + "table].[" + singleCond.fieldName + "] is not null");
                }
            }
            else
            {
                query.append("[" + singleCond.entityName + "table].[" + singleCond.fieldName + "]" + singleCond.operator + "?", singleCond.fieldValue);
            }
        }
        else if (condObj.isCompound)
        {
            const compoundCond:CompoundCondition = condObj as CompoundCondition;
            if(compoundCond.children.length === 0)
                query.append("1=1");
            else
            {
                query.append("(");
                for (let i = 0; i < compoundCond.children.length; i++)
                {
                    const childCond = compoundCond.children[i];
                    if (i > 0) query.append(compoundCond.operator === "&" ? " AND " : " OR ");
                    this.appendWhereClause(query, childCond);
                }
                query.append(")");
            }
        }
        else
        {
            query.append("1=1");
        }
    }
}
