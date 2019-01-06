import { IConfig, IEntityConfig, Context, UserInfo } from '../types';
import { defaultFieldConfigSet, defaultEntityConfigSet } from '../defaultConfig';
import { IDatabaseAdapter } from '../database/iDatabaseAdapter';
import { IStorageAdapter } from '../storage/iStorageAdapter';

/**
 * A factory for creating Context objects, which will store all details about the current session.
 */
export class ContextFactory
{
    private config:IConfig;

    /**
     * Initialize the context factory. This should be done before the server is started.
     * This will also merge defaultEntities and defaultFields into the config object.
     * @param inputConfig Input config object
     */
    constructor(inputConfig:IConfig)
    {
        this.config = inputConfig;

        // merge defaultFields into the config
        for (const entityName in this.config.entities)
        {
            if (!this.config.entities.hasOwnProperty(entityName) || defaultEntityConfigSet[entityName])
                continue;
            this.config.entities[entityName].fields = Object.assign({}, defaultFieldConfigSet, this.config.entities[entityName].fields);
        }

        // merge defaultEntities into the config
        for (const defaultEntityName in defaultEntityConfigSet)
        {
            if (!defaultEntityConfigSet.hasOwnProperty(defaultEntityName))
                continue;
            const defaultEntityConfig = defaultEntityConfigSet[defaultEntityName];
            if(this.config.entities[defaultEntityName])
            {
                const entityConfigClone:IEntityConfig = JSON.parse(JSON.stringify(defaultEntityConfig));
                this.config.entities[defaultEntityName] = entityConfigClone;
            }
            else
            {
                this.config.entities[defaultEntityName] = defaultEntityConfig;
            }
        }
    }

    /**
     * Construct a new Context object. This should be done at the beginning of each session.
     * @param req request object
     * @param res response object
     * @param entityName entity name
     * @returns context object
     */
    create(req:any, res:any, entityName:string, db:IDatabaseAdapter, storage:IStorageAdapter) : Context
    {
        const context: Context = new Context();
        context.config = this.config;
        context.req = req;
        context.res = res;
        context.user = new UserInfo();
        context.db = db;
        context.storage = storage;
        context.entityName = entityName;

        if (entityName !== "error" && !this.config.entities[entityName])
            throw { "tag": "1a83", "statusCode": 400, "msg": "invalid entity " + entityName };

        return context;
    }
};