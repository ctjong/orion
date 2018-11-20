import * as Sequelize from "sequelize";
import { IDatabaseAdapter } from "./iDatabaseAdapter";
import { INameValueMap, ICondition, Context, IConfig, CompoundCondition, SingleCondition } from "../types";
import { conditionFactory } from "../services/conditionFactory";
import { SqlQueryWrapper } from "./sqlQueryWrapper";
import { ISqlQueryWrapper } from "./iSqlQueryWrapper";
import { Op } from "sequelize";
import { helperService } from "../services/helperService";

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
        if (!config.database || !config.database.engine)
            throw "Missing/incomplete database configuration";
        this.engine = config.database.engine;
        this.models = {};
        this.sequelize = new Sequelize(config.database.connectionString);
        this.wrapper = wrapper ? wrapper : new SqlQueryWrapper();

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

        const query:Sequelize.FindOptions<any> = {};
        query.attributes = fields;
        query.where = this.getWhereClause(condition);
        query.offset = skip;
        query.limit = take;
        query.transaction = await this.sequelize.transaction();

        const orderByVal = [];
        if (orderByField.indexOf("~") === 0)
            orderByVal.push([orderByField.substring(1), "DESC"]);
        else
            orderByVal.push(orderByField);
        query.order = orderByVal;

        const model = this.models[entityName];
        return model.findAll(query);
    }

    findRecordByIdAsync(ctx: Context, entityName: string, recordId: string): Promise<any>
    {
        const fields = helperService.getFields(ctx, "read", entityName);
        const condition = conditionFactory.createSingle(entityName, "id", "=", recordId);
        return this.selectAsync(ctx, fields, entityName, condition, "id", 0, 1);
    }

    async countAsync(ctx: Context, entityName: string, condition: ICondition): Promise<any>
    {
        const query:Sequelize.FindOptions<any> = {};
        query.attributes = [[Sequelize.fn("COUNT", Sequelize.col("*")), "count"]];
        query.where = this.getWhereClause(condition);
        query.transaction = await this.sequelize.transaction();

        const model = this.models[entityName];
        const response = await model.findAll(query);
        return response[0]["count"];
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