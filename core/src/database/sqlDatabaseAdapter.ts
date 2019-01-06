import * as Sequelize from "sequelize";
import { IDatabaseAdapter } from "./iDatabaseAdapter";
import { INameValueMap, ICondition, Context, IConfig, CompoundCondition, SingleCondition } from "../types";
import { conditionFactory } from "../services/conditionFactory";
import { Op } from "sequelize";
import { helperService } from "../services/helperService";

const typeMap: INameValueMap =
{
    "id": Sequelize.INTEGER,
    "string": Sequelize.STRING,
    "text": Sequelize.TEXT,
    "int": Sequelize.INTEGER,
    "float": Sequelize.DOUBLE,
    "boolean": Sequelize.BOOLEAN,
    "secret": Sequelize.STRING,
    "timestamp": Sequelize.INTEGER
};

/**
 * Class that handles the interaction with an SQL database
 */
export class SqlDatabaseAdapter implements IDatabaseAdapter
{
    dialect: string;
    models: Sequelize.Models;
    sequelize: Sequelize.Sequelize;

    /**
     * Initialize the database adapter
     * @param config configuration object
     */
    constructor(config: IConfig)
    {
        if (!config.database || !config.database.dialect)
            throw "Missing/incomplete database configuration";
        this.dialect = config.database.dialect;
        this.models = {};
        this.sequelize = new Sequelize(
            config.database.name,
            config.database.userName,
            config.database.password,
            {
                host: config.database.host,
                dialect: config.database.dialect
            });

        this.initializeModels(config);
        this.initializeForeignKeys(config);
        this.ensureTablesExist(config);
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
        const response = await this.selectAsync(ctx, fields, entityName, condition, "id", 0, 1);
        return response[0];
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
     * @returns query results
     */
    async selectAsync(ctx: Context, fields: string[], entityName: string, condition: ICondition, orderByField: string, skip: number, take: number): Promise<any>
    {
        if (fields.length === 0)
            return null;

        const query: Sequelize.FindOptions<any> = {};
        query.attributes = fields;
        query.where = this.getWhereClause(condition);
        query.offset = skip;
        query.limit = take;

        const orderByVal = [];
        if (orderByField.indexOf("~") === 0)
            orderByVal.push([orderByField.substring(1), "DESC"]);
        else
            orderByVal.push(orderByField);
        query.order = orderByVal;

        const model = this.models[entityName];
        const response = await model.findAll(query);

        const responseData: any[] = [];
        response.forEach(item =>
        {
            if (item.dataValues)
                responseData.push(item.dataValues);
        });
        return responseData;
    }

    /**
     * Find a record that matches the given id
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param recordId Id of record to find
     * @returns query results
     */
    findRecordByIdAsync(ctx: Context, entityName: string, recordId: string): Promise<any>
    {
        const fields = helperService.getFields(ctx, "read", entityName);
        const condition = conditionFactory.createSingle(entityName, "id", "=", recordId);
        return this.selectAsync(ctx, fields, entityName, condition, "id", 0, 1);
    }

    /**
     * Count the number of records that match the given condition
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param condition Condition object
     * @returns query results
     */
    async countAsync(ctx: Context, entityName: string, condition: ICondition): Promise<any>
    {
        const query: Sequelize.FindOptions<any> = {};
        query.attributes = [[Sequelize.fn("COUNT", Sequelize.col("*")), "count"]];
        query.where = this.getWhereClause(condition);

        const model = this.models[entityName];
        const response = await model.findAll(query);
        return response[0].dataValues.count;
    }

    /**
     * Insert a new record
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param fieldNames New record field names
     * @param fieldValues New record field values
     * @returns inserted ID
     */
    async insertAsync(ctx: Context, entityName: string, fieldNames: string[], fieldValues: string[]): Promise<any>
    {
        if (fieldValues.length === 0)
            return null;

        const model = this.models[entityName];
        const values: INameValueMap = {};
        fieldNames.forEach((fieldName, index) => { values[fieldName] = fieldValues[index] });
        const newData = await model.create(values);
        return newData.id;
    }

    /**
     * Update a record
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param updateData Update data
     * @param condition Update condition
     */
    async updateAsync(ctx: Context, entityName: string, updateData: INameValueMap, condition: ICondition): Promise<any>
    {
        const model = this.models[entityName];
        const results = await model.update(updateData, { where: this.getWhereClause(condition) });
        return results[1];
    }

    /**
     * Delete a record from the database
     * @param ctx Request context
     * @param entityName Requested entity name
     * @param id Id of record to delete
     */
    async deleteRecordAsync(ctx: Context, entityName: string, id: string): Promise<any>
    {
        const condition = conditionFactory.createSingle(entityName, "id", "=", id);
        const model = this.models[entityName];
        await model.destroy({ where: this.getWhereClause(condition) });
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
                const fieldType = typeMap[fieldConfig.type];
                const isIdField = fieldConfig.type === "id";
                modelDef[fieldName] = { type: fieldType, primaryKey: isIdField, autoIncrement: isIdField };
            });
            this.models[entityName] = this.sequelize.define(entityName, modelDef);
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
     * Ensure all required tables exist in the database
     */
    private ensureTablesExist(config: IConfig)
    {
        Object.keys(config.entities).forEach(entityName =>
        {
            this.models[entityName].sync();
        });
    }

    /**
     * Create a query's where clause from a condition object
     * @param condition condition object
     * @returns where clause
     */
    private getWhereClause(condition: ICondition): any
    {
        const whereObj: any = {};
        if (condition.isCompound)
        {
            const compoundCond = condition as CompoundCondition;
            const childWhereObjs: any[] = [];
            compoundCond.children.forEach(child => childWhereObjs.push(this.getWhereClause(child)));
            if (compoundCond.operator === "&")
                whereObj[Op.and] = childWhereObjs;
            else
                whereObj[Op.or] = childWhereObjs;
        }
        else
        {
            const singleCond = condition as SingleCondition;
            let whereObjVal: any = {};
            if (singleCond.operator === "=")
                whereObjVal = singleCond.fieldValue;
            else if (singleCond.operator === "<>")
                whereObjVal[Op.ne] = singleCond.fieldValue;
            else if (singleCond.operator === "<")
                whereObjVal[Op.lt] = singleCond.fieldValue;
            else if (singleCond.operator === "<=")
                whereObjVal[Op.lte] = singleCond.fieldValue;
            else if (singleCond.operator === ">")
                whereObjVal[Op.gt] = singleCond.fieldValue;
            else if (singleCond.operator === ">=")
                whereObjVal[Op.gte] = singleCond.fieldValue;
            else if (singleCond.operator === "~")
                whereObjVal[Op.like] = `%${singleCond.fieldValue}%`;
            whereObj[singleCond.fieldName] = whereObjVal;
        }
        return whereObj;
    }
}