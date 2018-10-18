const defaultFields =
    {
        "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
        "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
        "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
    };

const defaultEntities =
    {
        "asset":
        {
            fields:
            {
                "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
                "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
                "filename": { type: "string", isEditable: false, createReq: 2, foreignKey: null }
            },
            allowedRoles:
            {
                "read": ["owner", "admin"],
                "create": ["member"],
                "update": [],
                "delete": ["owner", "admin"]
            }
        },
        "user":
        {
            fields:
            {
                "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
                "domain": { type: "string", isEditable: false, createReq: 0, foreignKey: null },
                "domainid": { type: "string", isEditable: false, createReq: 0, foreignKey: null },
                "roles": { type: "string", isEditable: false, createReq: 0, foreignKey: null },
                "username": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
                "password": { type: "secret", isEditable: true, createReq: 2, foreignKey: null },
                "email": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
                "firstname": { type: "string", isEditable: true, createReq: 1, foreignKey: null },
                "lastname": { type: "string", isEditable: true, createReq: 1, foreignKey: null },
                "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
            },
            allowedRoles:
            {
                "read": ["member", "owner", "admin"],
                "create": ["guest"],
                "update": ["owner", "admin"],
                "delete": ["admin"]
            }
        },
    };

/**
 * A factory for creating Context objects, which will store all details about the current session.
 */
module.exports = class ContextFactory
{
    constructor()
    {
        this.config = null;
    }

    /**
     * Construct a new Context object. This should be done at the beginning of each session.
     */
    create(req, res, entity)
    {
        const obj = 
        {
            config : this.config,
            req : req,
            res : res,
            entity : entity,
            userId : null,
            userName : null,
            userRoles : [],
            userDomain : null,
        };

        let errorObj = null;
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

        return obj;
    }

    /**
     * Initialize the config object. This should be done before the server is started.
     * This will also merge defaultEntities and defaultFields into the config object.
     * @param {any} inputConfig Input config object
     */
    initializeConfig(inputConfig)
    {
        this.config = inputConfig;

        // merge defaultFields into the this.config
        for (const entityName in this.config.entities)
        {
            if (!this.config.entities.hasOwnProperty(entityName) || !!defaultEntities[entityName])
                continue;
            this.config.entities[entityName].fields = Object.assign({}, defaultFields, this.config.entities[entityName].fields);
        }

        // merge defaultEntities into the this.config
        for (const defaultEntityName in defaultEntities)
        {
            if (!defaultEntities.hasOwnProperty(defaultEntityName))
                continue;
            const defaultEntity = defaultEntities[defaultEntityName];
            if(!!this.config.entities[defaultEntityName])
            {
                // the client's this.config specifies an override for a default entity
                for(const propName in defaultEntity)
                {
                    if (!defaultEntity.hasOwnProperty(propName))
                        continue;
                    this.config.entities[defaultEntityName][propName] = Object.assign({}, defaultEntity[propName], this.config.entities[defaultEntityName][propName]);
                }
            }
            else
            {
                this.config.entities[defaultEntityName] = defaultEntity;
            }
        }
    }

    /**
     * Get the this.config object
     * @returns this.config object
     */
    getConfig()
    {
        return this.config;
    }
};