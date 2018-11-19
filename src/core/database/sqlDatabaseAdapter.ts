import * as Sequelize from "sequelize";
import { IDatabaseAdapter } from "./iDatabaseAdapter";
import { INameValueMap, ICondition, Context, IConfig, Join } from "../types";
import { conditionFactory } from "../services/conditionFactory";
import { joinFactory } from "../services/joinFactory";
import { SqlQueryWrapper } from "./sqlQueryWrapper";
import { ISqlQueryWrapper } from "./iSqlQueryWrapper";

const typeMap: INameValueMap =
{
    "string": Sequelize.STRING,
    "text": Sequelize.TEXT,
    "int": Sequelize.INTEGER,
    "float": Sequelize.DOUBLE,
    "boolean": Sequelize.BOOLEAN,
    "secret": Sequelize.STRING
};

/**
 * Class that handles the interaction with an SQL database
 */
export class SqlDatabaseAdapter implements IDatabaseAdapter
{
    engine: string;
    models: Sequelize.Models;
    sequelize: Sequelize.Sequelize;
    wrapper: ISqlQueryWrapper;

    /**
     * Initialize the database adapter
     * @param config configuration object
     * @param wrapper optional query wrapper object
     */
    constructor(config: IConfig, wrapper?: ISqlQueryWrapper)
    {
        if (!config.database)
            throw "Missing database configuration";
        this.engine = config.database.engine;
        this.models = {};
        this.sequelize = new Sequelize(config.database.connectionString);
        this.wrapper = wrapper ? wrapper : new SqlQueryWrapper();

        this.initializeModels(config);
        this.initializeForeignKeys(config);
    }

    /**
     * Quick find a record based on the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entityName Requested entity
     * @param conditionMap Search condition
     * @returns query results
     */
    async quickFindAsync(ctx: Context, fields: string[], entityName: string, conditionMap: INameValueMap): Promise<any>
    {
        const condition = conditionFactory.createCompound("&", []);
        for (const key in conditionMap)
        {
            if (!conditionMap.hasOwnProperty(key)) continue;
            condition.children.push(conditionFactory.createSingle(entityName, key, "=", conditionMap[key]));
        }
        return this.selectAsync(ctx, fields, entityName, condition, "id", 0, 1, false, false);
    }

    /**
     * Find records that match the given condition
     * @param ctx Request context
     * @param fields Requested fields
     * @param entityName Requested entity
     * @param condition Search condition
     * @param orderByField Field to order the results by
     * @param skip Number of matches to skip
     * @param take Number of matches to take
     * @param resolveFK Whether or not foreign keys should be resolved
     * @param isFullMode Whether or not result should be returned in full mode
     * @returns query results
     */
    async selectAsync(ctx: Context, fields: string[], entityName: string, condition: ICondition, orderByField: string, skip: number, take: number, resolveFK: boolean, isFullMode: boolean): Promise<any>
    {
        if (fields.length === 0)
            return null;

        const joins = resolveFK ? this.getJoins(ctx, fields, entityName) : [];
        console.log(joins);
        const fieldsToSelect: string[] = [];
        fields.forEach(fieldName =>
        {
            if (isFullMode || fieldName.indexOf("richtext") === 0)
                fieldsToSelect.push(fieldName);
        });

        /*
        const joins = resolveFK ? this.getJoins(ctx, fields, entityName) : [];
        const query = new Query();
        const tableName = entityName + "table";

        const fieldsToSelect: string[] = [];
        fields.forEach(fieldName =>
        {
            if (isFullMode || fieldName.indexOf("richtext") === 0)
                fieldsToSelect.push(fieldName);
        });

        query.append(`select [${entityName}table].[${fieldsToSelect[0]}]`);
        for (let i = 1; i < fieldsToSelect.length; i++)
            query.append(`, [${entityName}table].[${fieldsToSelect[i]}]`);
        for (let i = 0; i < joins.length; i++)
            query.append(`, ${this.getSelectExpression(joins[i])}`);
        query.append(` from [${tableName}]`);
        for (let i = 0; i < joins.length; i++)
            query.append(` ${this.getJoinExpression(joins[i])}`);
        query.append(" where ");
        this.appendWhereClause(query, condition);
        orderByField = decodeURIComponent(orderByField);
        if (orderByField.indexOf("~") === 0)
            query.append(` order by [${entityName}table].[${orderByField.substring(1)}] desc `);
        else
            query.append(` order by [${entityName}table].[${orderByField}] `);
        query.append(" OFFSET (?) ROWS FETCH NEXT (?) ROWS ONLY", skip.toString(), take.toString());

        return this.executeAsync(ctx, query);
        */

        const transaction = await this.sequelize.transaction();
        const model = this.models[entityName];
        // const where = {};

        return model.findOne({ attributes: fields, transaction });
    }

    findRecordByIdAsync(ctx: Context, entityName: string, recordId: string): Promise<any>
    {
        throw new Error("Method not implemented.");
    }

    countAsync(ctx: Context, entityName: string, condition: ICondition): Promise<any>
    {
        throw new Error("Method not implemented.");
    }

    insertAsync(ctx: Context, entityName: string, fieldNames: string[], fieldValues: string[]): Promise<any>
    {
        throw new Error("Method not implemented.");
    }

    updateAsync(ctx: Context, entityName: string, updateData: INameValueMap, condition: ICondition): Promise<any>
    {
        throw new Error("Method not implemented.");
    }

    deleteRecordAsync(ctx: Context, entityName: string, id: string): Promise<any>
    {
        throw new Error("Method not implemented.");
    }

    /**
     * Initialize the data models
     * @param config configuration object
     */
    private initializeModels(config: IConfig)
    {
        Object.keys(config.entities).forEach(entityName =>
        {
            const entityConfig = config.entities[entityName];
            const modelDef: INameValueMap = {};
            Object.keys(entityConfig.fields).forEach(fieldName =>
            {
                const fieldConfig = entityConfig.fields[fieldName];
                modelDef[fieldName] = { type: typeMap[fieldConfig.type] };
            });
            this.models[entityName] = this.sequelize.define(entityName, modelDef);
            this.models[entityName].sync();
        });
    }

    /**
     * Initialize the foreign key relationships in the data models
     * @param config configuration object
     */
    private initializeForeignKeys(config: IConfig)
    {
        Object.keys(config.entities).forEach(entityName =>
        {
            const entityConfig = config.entities[entityName];
            Object.keys(entityConfig.fields).forEach(fieldName =>
            {
                const fieldConfig = entityConfig.fields[fieldName];
                if (!fieldConfig.foreignKey)
                    return;

                const targetName = fieldConfig.foreignKey.targetEntityName;
                if (!fieldConfig.foreignKey.isManyToMany)
                    this.models[entityName].belongsTo(this.models[targetName], { foreignKey: fieldName });
                else
                {
                    const mapTableName = targetName < entityName ? `${targetName}_${entityName}` : `${entityName}_${targetName}`;
                    this.models[entityName].belongsToMany(this.models[targetName], { through: mapTableName });
                }
            });
        })
    }

    /**
     * Get Join objects to resolve foreign keys
     * @param ctx Request context
     * @param fields Fields in the requested entity
     * @param entityName Requested entity
     * @returns an array of Joins
     */
    private getJoins(ctx: Context, fields: string[], entityName: string): Join[]
    {
        const joins = [];
        const ctxFields = ctx.config.entities[entityName].fields;
        for (let f = 0; f < fields.length; f++)
        {
            const fldName = fields[f];
            const fieldObj = ctxFields[fldName];
            if (fieldObj.foreignKey) 
            {
                joins.push(joinFactory.createForForeignKey(ctx, entityName, fldName));
            }
        }
        return joins;
    }
}