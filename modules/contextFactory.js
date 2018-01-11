/**
 * A factory for creating Context objects, which will store all details about the current session.
 */
module.exports = function () 
{
    var _this = this;
    var config = null;

    var defaultFields =
        {
            "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
            "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
            "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
        };

    var defaultEntities =
        {
            "asset":
            {
                fields:
                {
                    "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
                    "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
                    "filename": { type: "string", isEditable: true, createReq: 2, foreignKey: null }
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
                    "password": { type: "secret", isEditable: false, createReq: 2, foreignKey: null },
                    "email": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
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
        var errorObj = null;

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
        for (var entityName in config.entities)
        {
            if (!config.entities.hasOwnProperty(entityName) || !!defaultEntities[entityName])
                continue;
            for (var defaultFieldName in defaultFields)
            {
                if (!defaultFields.hasOwnProperty(defaultFieldName))
                    continue;
                config.entities[entityName].fields[defaultFieldName] = defaultFields[defaultFieldName];
            }
        }

        // merge defaultEntities into the config
        for (var defaultEntityName in defaultEntities)
        {
            if (!defaultEntities.hasOwnProperty(defaultEntityName))
                continue;
            var inputEntity = config.entities[defaultEntityName];
            var defaultEntity = defaultEntities[defaultEntityName];
            config.entities[defaultEntityName] = mergeEntityConfigs(inputEntity, defaultEntity);
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
     * Merge an input entity config object with a default entity object.
     * @param {any} inputEntity Input entity config object
     * @param {any} defaultEntity Default entity config object
     * @returns merged entity config object
     */
    function mergeEntityConfigs(inputEntity, defaultEntity)
    {
        if (!inputEntity)
            return defaultEntity;

        // merge property names from both objects
        var mergedEntity = {};
        mergePropNames(inputEntity, defaultEntity, mergedEntity);

        // go through each object property
        for (var propName in mergedEntity)
        {
            if (!mergedEntity.hasOwnProperty(propName))
                continue;

            if (propName === "fields")
            {
                // merge property names from both fields config objects
                mergedEntity.fields = {};
                mergePropNames(inputEntity.fields, defaultEntity.fields, mergedEntity.fields);
                
                // merge each fields property from both config objects
                // for this we prioritize the values from default config
                for (var fieldName in mergedEntity.fields)
                {
                    mergePropValue(defaultEntity.fields, inputEntity.fields, fieldName, mergedEntity.fields);
                }
            }
            else if (propName === "allowedRoles")
            {
                // merge property names from both allowedRoles config objects
                mergedEntity.allowedRoles = {};
                mergePropNames(inputEntity.allowedRoles, defaultEntity.allowedRoles, mergedEntity.allowedRoles);

                // merge each allowedRoles property from both config objects
                // for this we prioritize the values from input config
                for (var actionName in mergedEntity.allowedRoles)
                {
                    mergePropValue(inputEntity.allowedRoles, defaultEntity.allowedRoles, actionName, mergedEntity.allowedRoles);
                }
            }
            else
            {
                // merge other properties from both config objects
                // for this we prioritize the values from input config
                mergePropValue(inputEntity, defaultEntity, propName, mergedEntity);
            }
        }

        return mergedEntity;
    }

    /**
     * Take property names from two objects and put them into a merged object.
     * @param {any} obj1 Source object 1
     * @param {any} obj2 Source object 2
     * @param {any} mergedObj Target object
     */
    function mergePropNames(obj1, obj2, mergedObj)
    {
        if (!!obj1)
            for (var propName in obj1)
                if (obj1.hasOwnProperty(propName))
                    mergedObj[propName] = null;
        if (!!obj2)
            for (var propName in obj2)
                if (obj2.hasOwnProperty(propName))
                    mergedObj[propName] = null;
    }

    /**
     * Take the property with the given name from two source objects, and put it into a target object,
     * based on which source object takes priority.
     * @param {any} highPriObj Higher priority source object
     * @param {any} lowPriObj Lower priority source object
     * @param {any} propName Property name
     * @param {any} mergedObj Target object
     */
    function mergePropValue(highPriObj, lowPriObj, propName, mergedObj)
    {
        if (!mergedObj.hasOwnProperty(propName))
            return;
        if (!!highPriObj && !!highPriObj[propName])
            mergedObj[propName] = highPriObj[propName];
        else
            mergedObj[propName] = lowPriObj[propName];
    }

    this.Context = Context;
    this.initializeConfig = initializeConfig;
    this.getConfig = getConfig;
    _construct();
};