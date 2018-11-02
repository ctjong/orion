import { Config, Entity, Context, UserInfo } from '../types';
import { defaultFields, defaultEntities } from '../defaultConfig';
import { Database } from '../database';
import { Storage } from '../storage';

/**
 * A factory for creating Context objects, which will store all details about the current session.
 */
class ContextFactory
{
    private config:Config;

    /**
     * Construct a new Context object. This should be done at the beginning of each session.
     * @param req request object
     * @param res response object
     * @param entity entity name
     * @returns context object
     */
    create(req:any, res:any, entity:string, db:Database, storage:Storage) : Context
    {
        const context: Context = new Context();
        context.config = this.config;
        context.req = req;
        context.res = res;
        context.user = new UserInfo();
        context.db = db;
        context.storage = storage;

        let errorObj:any = null;
        try
        {
            if (!this.config.entities.hasOwnProperty(entity)) 
            {
                throw { "tag": "1a83", "statusCode": 400, "msg": "invalid entity " + entity };
            }
        }
        catch (ex2)
        {
            errorObj = ex2;
        }
        if (errorObj)
            throw errorObj;

        return context;
    }

    /**
     * Initialize the config object. This should be done before the server is started.
     * This will also merge defaultEntities and defaultFields into the config object.
     * @param inputConfig Input config object
     */
    initializeConfig(inputConfig:Config): void
    {
        this.config = inputConfig;

        // merge defaultFields into the this.config
        for (const entityName in this.config.entities)
        {
            if (!this.config.entities.hasOwnProperty(entityName) || defaultEntities[entityName])
                continue;
            this.config.entities[entityName].fields = Object.assign({}, defaultFields, this.config.entities[entityName].fields);
        }

        // merge defaultEntities into the this.config
        for (const defaultEntityName in defaultEntities)
        {
            if (!defaultEntities.hasOwnProperty(defaultEntityName))
                continue;
            const defaultEntity = defaultEntities[defaultEntityName];
            if(this.config.entities[defaultEntityName])
            {
                const entityClone:Entity = JSON.parse(JSON.stringify(defaultEntity));
                this.config.entities[defaultEntityName] = entityClone;
            }
            else
            {
                this.config.entities[defaultEntityName] = defaultEntity;
            }
        }
    }
};

const contextFactory:ContextFactory = new ContextFactory();
export { contextFactory };