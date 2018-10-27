import { MysqlQuery as Query } from "./mysqlQuery";
import { Context, NameValueMap, Join, Condition, SingleCondition, CompoundCondition } from "../../types";
import { conditionFactory } from "../../services/conditionFactory";
import { joinFactory } from "../../services/joinFactory";
import { execService } from "../../services/execService";

/**
 * A module for handling interaction with an MSSQL database
 */
export class MysqlDatabase
{
    pool:any;

    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entity Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    async quickFind(ctx:Context, fields:string[], entity:string, conditionMap:NameValueMap): Promise<any>
    {
        const condition = conditionFactory.createCompound("&", []);
        for (const key in conditionMap)
        {
            if (!conditionMap.hasOwnProperty(key)) continue;
            condition.children.push(conditionFactory.createSingle(entity, key, "=", conditionMap[key]));
        }
        const responseArr = await this.select(ctx, fields, entity, condition, "id", 0, 1, false, false);
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
    async select(ctx:Context, fields:string[], entity:string, condition:Condition, orderByField:string, skip:number, take:number, 
        resolveFK:boolean, isFullMode:boolean): Promise<any>
    {
        const joins = resolveFK ? this.getJoins(ctx, fields, entity) : [];
        const query = new Query();
        const tableName = entity + "table";
        query.append("select ");
        for (let i = 0; i < fields.length; i++)
        {
            const fieldName = fields[i];
            if (!isFullMode && fieldName.contains("richtext")) continue;
            query.append((i === 0 ? "" : ", ") + "`" + entity + "table`.`" + fieldName + "`");
        }
        for (let i = 0; i < joins.length; i++)
        {
            query.append(", " + getSelectExpression(joins[i]));
        }
        query.append(" from `" + tableName + "`");
        for (let i = 0; i < joins.length; i++)
        {
            query.append(" " + getJoinExpression(joins[i]));
        }
        query.append(" where ");
        appendWhereClause(query, condition);
        orderByField = decodeURIComponent(orderByField);
        if (orderByField.indexOf("~") === 0)
        {
            query.append(" order by `" + entity + "table`.`" + orderByField.substring(1) + "` desc ");
        }
        else
        {
            query.append(" order by `" + entity + "table`.`" + orderByField + "` ");
        }
        query.append(" LIMIT ? OFFSET ?", take, skip);
        this.execute(ctx, query, successCb, completeCb);
    }

    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entity Requested entity
     * @param recordId Id of record to find
     * @returns query results
     */
    async findRecordById(ctx:Context, entity:string, recordId:string): Promise<any>
    {
        const fields = this.helper.getFields(ctx, "read", entity);
        const condition = this.conditionFactory.createSingle(entity, "id", "=", recordId);
        this.select(ctx, fields, entity, condition, "id", 0, 1, true, false, (responseArr) =>
        {
            const record = responseArr[0];
            successCb(this.helper.fixDataKeysAndTypes(ctx, record, entity));
        }, completeCb);
    }

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entity Requested entity
     * @param condition Condition
     * @returns query results
     */
    async count(ctx:Context, entity:string, condition:Condition): Promise<any>
    {
        const joins = resolveFK ? getJoins(ctx, fields, entity, this.joinFactory) : [];
        const query = new Query();
        const tableName = entity + "table";
        query.append("select count(*) as count from `" + tableName + "` where ");
        appendWhereClause(query, condition);
        this.execute(ctx, query, (dbResponse) =>
        {
            successCb(dbResponse[0].count);
        }, completeCb);
    }

    /**
     * Insert a new record
     * @param ctx Request context
     * @param entity Requested entity
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    insert(ctx:Context, entity:string, fieldNames:string[], fieldValues:string[]): Promise<any>
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

        return new Promise(async resolve =>
        {
            const dbResponse = await this.execute(ctx, query);
            resolve(dbResponse.insertId);
        });
    }

    /**
     * Update a record
     * @param ctx Request context
     * @param entity Requested entity
     * @param updateData Update data
     * @param condition Update condition
     * @returns query results
     */
    update(ctx:Context, entity:string, updateData:NameValueMap, condition:Condition): Promise<any>
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
        query.append("delete from `" + tableName + "` where ");
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
     * Execute a query
     * @param ctx Request context
     * @param query Query to execute
     * @param successCb Success callback
     * @param completeCb Complete callback
     */
    async execute(ctx:Context, query:Query): Promise<any>
    {
        await this.ensurePoolInitializedAsync(ctx);
        const queryString = query.getQueryString();
        const queryParams = query.getQueryParams();
        console.log("-------------------------------------------------");
        console.log("Sending query to database:");
        console.log(queryString);
        console.log("Query parameters:");
        console.log(queryParams);

        return new Promise(async resolve =>
        {
            const response:NameValueMap = await this.queryAsync(queryString, queryParams);
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
            resolve(results);
        });
    }

    /**
     * Ensure the connection this.pool is initialized
     * @param ctx Request context
     */
    ensurePoolInitializedAsync(ctx:Context)
    {
        return new Promise(resolve =>
        {
            if (this.pool)
            {
                resolve();
                return;
            }
            const sql = require("mysql");

            // there is an issue with creating mysql connection based on connection string.
            // so we have to convert the string into a connection properties object.
            const connString = ctx.config.database.connectionString;
            const connStringParts = connString.split(";");
            const connProps:NameValueMap = {};
            for (let i = 0; i < connStringParts.length; i++)
            {
                const connPropTokens = connStringParts[i].split('=');
                connProps[connPropTokens[0]] = connPropTokens[1];
            }
            this.pool = sql.createPool(
                {
                    host: connProps.Server,
                    user: connProps.Uid,
                    password: connProps.Pwd,
                    database: connProps.Database,
                    multipleStatements: true
                });
            this.pool.sql = sql;
            resolve();
        });
    }

    /**
     * Run a query
     */
    queryAsync(queryString:string, queryParams:NameValueMap)
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
    private getJoins(ctx:Context, fields:string[], entity:string)
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
    private getJoinExpression(joinObj:Join)
    {
        return "INNER JOIN `" + joinObj.e2 + "table` `" + joinObj.e2Alias + "` ON `" + joinObj.e1 + "table`.`" + joinObj.e1JoinField + "` = `" + joinObj.e2Alias + "`.`" + joinObj.e2JoinField + "`";
    }

    /**
     * Get a select expression for the given Join object
     * @param joinObj Join object
     * @returns a SELECT clause string
     */
    private getSelectExpression(joinObj:Join)
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
                query.append("`" + condObj.entity + "table`.`" + condObj.fieldName + "` like ?", "%" + condObj.fieldValue + "%");
            }
            else if (typeof (condObj.fieldValue) === "string" && condObj.fieldValue.toLowerCase() === "null")
            {
                if (condObj.operator == "=")
                {
                    query.append("`" + condObj.entity + "table`.`" + condObj.fieldName + "` is null");
                }
                else
                {
                    query.append("`" + condObj.entity + "table`.`" + condObj.fieldName + "` is not null");
                }
            }
            else
            {
                query.append("`" + condObj.entity + "table`.`" + condObj.fieldName + "`" + condObj.operator + "?", condObj.fieldValue);
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