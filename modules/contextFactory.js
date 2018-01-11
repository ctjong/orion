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
     * This will also merge the input config object with the default config object.
     * @param {any} inputConfig Input config object
     */
    function initializeConfig(inputConfig)
    {
        config = inputConfig;

        // merge field config objects
        for (var entityName in config.entities)
        {
            if (!config.entities.hasOwnProperty(entityName))
                continue;
            for (var defaultFieldName in defaultFields)
            {
                if (!defaultFields.hasOwnProperty(defaultFieldName))
                    continue;
                config.entities[entityName].fields[defaultFieldName] = defaultFields[defaultFieldName];
            }
        }

        // merge entity config objects
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
        var mergedEntity = {};

        // merge fields
        // fields from default config is prioritized (overriding it is not allowed).
        mergedEntity.fields = {};
        for (var defaultFieldName in defaultEntity.fields)
        {
            if (!defaultEntity.fields.hasOwnProperty(defaultFieldName))
                continue;
            mergedEntity.fields[defaultFieldName] = defaultEntity.fields[defaultFieldName];
        }
        for (var inputFieldName in inputEntity.fields)
        {
            if (!inputEntity.fields.hasOwnProperty(inputFieldName) ||
                (!!defaultEntity.fields && !!defaultEntity.fields[inputFieldName]))
                continue;
            mergedEntity.fields[inputFieldName] = inputEntity.fields[inputFieldName];
        }

        // merge allowedRoles
        // allowedRoles rules from input config is prioritized.
        mergedEntity.allowedRoles = {};
        for (var inputActionName in inputEntity.allowedRoles)
        {
            if (!inputEntity.allowedRoles.hasOwnProperty(inputActionName))
                continue;
            mergedEntity.allowedRoles[inputActionName] = inputEntity.allowedRoles[inputActionName];
        }
        for (var defaultActionName in defaultEntity.allowedRoles)
        {
            if (!defaultEntity.allowedRoles.hasOwnProperty(defaultActionName) ||
                (!!inputEntity.allowedRoles && !!inputEntity.allowedRoles[defaultActionName]))
                continue;
            mergedEntity.allowedRoles[defaultActionName] = defaultEntity.allowedRoles[defaultActionName];
        }

        // merge other properties
        // properties from input config is prioritized.
        for (var inputKey in inputEntity)
        {
            if (!inputEntity.hasOwnProperty(inputKey) || inputKey === "fields" || inputKey === "allowedRules")
                continue;
            mergedEntity[inputKey] = inputEntity[inputKey];
        }
        for (var defaultKey in defaultEntity)
        {
            if (!defaultEntity.hasOwnProperty(defaultKey) || !!inputEntity[defaultKey] || defaultKey === "fields" || defaultKey === "allowedRules")
                continue;
            mergedEntity[defaultKey] = inputEntity[defaultKey];
        }

        return mergedEntity;
    }

    this.Context = Context;
    this.initializeConfig = initializeConfig;
    this.getConfig = getConfig;
    _construct();
};