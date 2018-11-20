import { MysqlQuery as Query } from "./mysqlQuery";
import { Context, INameValueMap, Join, ICondition, SingleCondition, CompoundCondition, IConfig } from "../../types";
import { conditionFactory } from "../../services/conditionFactory";
import { joinFactory } from "../../services/joinFactory";
import { execService } from "../../services/execService";
import { helperService } from "../../services/helperService";
import * as mysql from "mysql";

interface IQueryResponse { error:any, results:any };


/**
 * A module for handling interaction with an MSSQL database
 */
export class MysqlDatabase 
{
    private pool:any;

    /**
     * Construct a MySQL database adapter
     * @param config configuration object
     * @param pool optional connection pool module
     */
    constructor(config:IConfig, pool?:any)
    {
        if(pool)
            this.pool = pool;
        else
        {
            // there is an issue with creating mysql connection based on connection string.
            // so we have to convert the string into a connection properties object.
            const connString = config.database.connectionString;
            const connStringParts = connString.split(";");
            const connProps:INameValueMap = {};
            for (let i = 0; i < connStringParts.length; i++)
            {
                const connPropTokens = connStringParts[i].split('=');
                connProps[connPropTokens[0]] = connPropTokens[1];
            }
            this.pool = mysql.createPool(
                {
                    host: connProps.Server,
                    user: connProps.Uid,
                    password: connProps.Pwd,
                    database: connProps.Database,
                    multipleStatements: true
                });
            this.pool.sql = mysql;
        }
    }

    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entityName Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    async quickFindAsync(ctx:Context, fields:string[], entity:string, conditionMap:INameValueMap): Promise<any>
    {
        const condition = conditionFactory.createCompound("&", []);
        for (const key in conditionMap)
        {
            if (!conditionMap.hasOwnProperty(key)) continue;
            condition.children.push(conditionFactory.createSingle(entity, key, "=", conditionMap[key]));
        }
        const responseArr = await this.selectAsync(ctx, fields, entity, condition, "id", 0, 1, false, false);
        return responseArr[0];
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
    selectAsync(ctx:Context, fields:string[], entity:string, condition:ICondition, orderByField:string, skip:number, take:number, 
        resolveFK:boolean, isFullMode:boolean): Promise<any>
    {
        const joins = resolveFK ? this.getJoins(ctx, fields, entity) : [];
        const query = new Query();
        const tableName = entity + "table";
        query.append("select ");
        for (let i = 0; i < fields.length; i++)
        {
            const fieldName = fields[i];
            if (!isFullMode && fieldName.indexOf("richtext") >= 0) continue;
            query.append((i === 0 ? "" : ", ") + "`" + entity + "table`.`" + fieldName + "`");
        }
        for (let i = 0; i < joins.length; i++)
        {
            query.append(", " + this.getSelectExpression(joins[i]));
        }
        query.append(" from `" + tableName + "`");
        for (let i = 0; i < joins.length; i++)
        {
            query.append(" " + this.getJoinExpression(joins[i]));
        }
        query.append(" where ");
        this.appendWhereClause(query, condition);
        orderByField = decodeURIComponent(orderByField);
        if (orderByField.indexOf("~") === 0)
        {
            query.append(" order by `" + entity + "table`.`" + orderByField.substring(1) + "` desc ");
        }
        else
        {
            query.append(" order by `" + entity + "table`.`" + orderByField + "` ");
        }
        query.append(" LIMIT ? OFFSET ?", take.toString(), skip.toString());
        return this.executeAsync(ctx, query);
    }

    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entity Requested entity
     * @param recordId Id of record to find
     * @returns query results
     */
    async findRecordByIdAsync(ctx:Context, entity:string, recordId:string): Promise<any>
    {
        const fields = helperService.getFields(ctx, "read", entity);
        const condition = conditionFactory.createSingle(entity, "id", "=", recordId);
        const responseArr = await this.selectAsync(ctx, fields, entity, condition, "id", 0, 1, true, false);
        const record = responseArr[0];
        return helperService.fixDataKeysAndTypes(ctx, record, entity);
    }

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entity Requested entity
     * @param condition Condition object
     * @returns query results
     */
    async countAsync(ctx:Context, entity:string, condition:ICondition): Promise<any>
    {
        const query = new Query();
        const tableName = entity + "table";
        query.append("select count(*) as count from `" + tableName + "` where ");
        this.appendWhereClause(query, condition);
        const dbResponse = await this.executeAsync(ctx, query);
        return dbResponse[0].count;
    }

    /**
     * Insert a new record
     * @param ctx Request context
     * @param entity Requested entity
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    async insertAsync(ctx:Context, entity:string, fieldNames:string[], fieldValues:string[]): Promise<any>
    {
        const query = new Query();
        const tableName = entity + "table";
        const fieldNamesStr = "`" + fieldNames.join("`,`") + "`";
        query.append("insert into `" + tableName + "` (" + fieldNamesStr + ") values (");
        for (let i = 0; i < fieldValues.length; i++)
        {
            query.append((i === 0 ? "" : ",") + "?", fieldValues[i]);
        }
        query.append(")");

        const dbResponse = await this.executeAsync(ctx, query);
        return dbResponse.insertId;
    }

    /**
     * Update a record
     * @param ctx Request context
     * @param entity Requested entity
     * @param updateData Update data
     * @param condition Update condition
     * @returns query results
     */
    updateAsync(ctx:Context, entity:string, updateData:INameValueMap, condition:ICondition): Promise<any>
    {
        const query = new Query();
        let isFirstSetClause = true;
        const tableName = entity + "table";
        query.append("update `" + tableName + "` set ");

        for (const fieldName in updateData)
        {
            if (!updateData.hasOwnProperty(fieldName))
                continue;
            query.append((isFirstSetClause ? "" : ",") + fieldName + "=?", updateData[fieldName]);
            isFirstSetClause = false;
        }
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
    deleteRecordAsync(ctx:Context, entity:string, id:string): Promise<any>
    {
        const query = new Query();
        const tableName = entity + "table";
        const condition = conditionFactory.createSingle(entity, "id", "=", id);
        query.append("delete from `" + tableName + "` where ");
        this.appendWhereClause(query, condition);
        return this.executeAsync(ctx, query);
    }

    /**
     * Execute a query
     * @param ctx Request context
     * @param query Query to execute
     * @param successCb Success callback
     * @param completeCb Complete callback
     * @returns query results
     */
    async executeAsync(ctx:Context, query:Query): Promise<any>
    {
        const queryString = query.getQueryString();
        const queryParams = query.getQueryParams();
        console.log("-------------------------------------------------");
        console.log("Sending query to database:");
        console.log(queryString);
        console.log("Query parameters:");
        console.log(queryParams);

        const response:INameValueMap = await this.queryAsync(queryString, queryParams);
        let results:any = null;
        if (response.error)
        {
            console.log(response.error);
            execService.sendErrorResponse(ctx, "a07f", 500, "error while sending query to database");
        }
        else
        {
            results = response.results;
        }
        console.log("-------------------------------------------------");
        return results;
    }

    /**
     * Run a query
     */
    queryAsync(queryString:string, queryParams:INameValueMap): Promise<IQueryResponse>
    {
        return new Promise(resolve =>
        {
            this.pool.query(queryString, queryParams, (error:any, results:any) =>
            {
                resolve({ error, results });
            });
        });
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
        const joins:Join[] = [];
        const ctxFields = ctx.config.entities[entity].fields;
        fields.forEach(fldName =>
        {
            const fieldObj = ctxFields[fldName];
            if (fieldObj.foreignKey) 
            {
                joins.push(joinFactory.createForForeignKey(ctx, entity, fldName));
            }
        });
        return joins;
    }


    /**
     * Get a join expression for the given Join object
     * @param joinObj Join object
     * @returns a JOIN clause string
     */
    private getJoinExpression(joinObj:Join): string
    {
        return "INNER JOIN `" + joinObj.e2 + "table` `" + joinObj.e2Alias + "` ON `" + joinObj.e1 + "table`.`" + joinObj.e1JoinField + "` = `" + joinObj.e2Alias + "`.`" + joinObj.e2JoinField + "`";
    }

    /**
     * Get a select expression for the given Join object
     * @param joinObj Join object
     * @returns a SELECT clause string
     */
    private getSelectExpression(joinObj:Join): string
    {
        let str = "";
        for (let i = 0; i < joinObj.e2SelectFields.length; i++)
        {
            str += (str === "" ? "" : ", ") + "`" + joinObj.e2Alias + "`.`" + joinObj.e2SelectFields[i] + "` AS `" + joinObj.e2Alias + "_" + joinObj.e2SelectFields[i] + "`";
        }
        return str;
    }

    /**
     * Append where clause to the given query based on the specified condition
     * @param query Query object
     * @param condObj Condition object
     */
    private appendWhereClause(query:Query, condObj:ICondition): void
    {
        if (condObj instanceof SingleCondition)
        {
            if (condObj.fieldName === "1" && condObj.fieldValue === "1")
            {
                query.append("1=1");
            }
            else if (condObj.operator === "~")
            {
                query.append("`" + condObj.entityName + "table`.`" + condObj.fieldName + "` like ?", "%" + condObj.fieldValue + "%");
            }
            else if (typeof (condObj.fieldValue) === "string" && condObj.fieldValue.toLowerCase() === "null")
            {
                if (condObj.operator == "=")
                {
                    query.append("`" + condObj.entityName + "table`.`" + condObj.fieldName + "` is null");
                }
                else
                {
                    query.append("`" + condObj.entityName + "table`.`" + condObj.fieldName + "` is not null");
                }
            }
            else
            {
                query.append("`" + condObj.entityName + "table`.`" + condObj.fieldName + "`" + condObj.operator + "?", condObj.fieldValue);
            }
        }
        else if (condObj instanceof CompoundCondition && condObj.children.length > 0)
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