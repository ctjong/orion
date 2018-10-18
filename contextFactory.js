/**
 * A factory for creating Context objects, which will store all details about the current session.
 */
module.exports = function () 
{
    let config = null;

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

    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    function _construct() { }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    /**
     * Construct a new Context object. This should be done at the beginning of each session.
     */
    function Context(req, res, entity)
    {
        this.config = config;
        this.req = req;
        this.res = res;
        this.entity = entity;
        this.userId = null;
        this.userName = null;
        this.userRoles = [];
        this.userDomain = null;
        let errorObj = null;

        try
        {
            if (!config.entities.hasOwnProperty(entity)) 
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
    }

    /**
     * Initialize the config object. This should be done before the server is started.
     * This will also merge defaultEntities and defaultFields into the config object.
     * @param {any} inputConfig Input config object
     */
    function initializeConfig(inputConfig)
    {
        config = inputConfig;

        // merge defaultFields into the config
        for (const entityName in config.entities)
        {
            if (!config.entities.hasOwnProperty(entityName) || !!defaultEntities[entityName])
                continue;
            config.entities[entityName].fields = Object.assign({}, defaultFields, config.entities[entityName].fields);
        }

        // merge defaultEntities into the config
        for (const defaultEntityName in defaultEntities)
        {
            if (!defaultEntities.hasOwnProperty(defaultEntityName))
                continue;
            const defaultEntity = defaultEntities[defaultEntityName];
            if(!!config.entities[defaultEntityName])
            {
                // the client's config specifies an override for a default entity
                for(const propName in defaultEntity)
                {
                    if (!defaultEntity.hasOwnProperty(propName))
                        continue;
                    config.entities[defaultEntityName][propName] = Object.assign({}, defaultEntity[propName], config.entities[defaultEntityName][propName]);
                }
            }
            else
            {
                config.entities[defaultEntityName] = defaultEntity;
            }
        }
    }

    /**
     * Get the config object
     * @returns config object
     */
    function getConfig()
    {
        return config;
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    /**
     * Merge config override with the default values
     * @param {any} overrideObj Override object from client's config
     * @param {any} defaultObj Default config object
     */
    function mergeDefaultConfig(overrideObj, defaultObj)
    {
        if(typeof defaultObj === "function")
            return !overrideObj ? defaultObj : overrideObj;
        const mergedObj = Object.assign({}, overrideObj);
        for(const key in defaultObj)
        {
            if(!defaultObj.hasOwnProperty(key) || !!mergedObj[key])
                continue;
            mergedObj[key] = defaultObj[key];
        }
        return mergedObj;
    }

    this.Context = Context;
    this.initializeConfig = initializeConfig;
    this.getConfig = getConfig;
    _construct();
};