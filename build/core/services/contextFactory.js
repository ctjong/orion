"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const defaultFields = {
    "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
    "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
    "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
};
const defaultEntities = {
    "asset": {
        fields: {
            "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
            "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
            "filename": { type: "string", isEditable: false, createReq: 2, foreignKey: null }
        },
        allowedRoles: {
            "read": ["owner", "admin"],
            "create": ["member"],
            "update": [],
            "delete": ["owner", "admin"]
        }
    },
    "user": {
        fields: {
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
        allowedRoles: {
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
class ContextFactory {
    /**
     * Construct a new Context object. This should be done at the beginning of each session.
     * @param req request object
     * @param res response object
     * @param entity entity name
     * @returns context object
     */
    create(req, res, entity) {
        const context = new types_1.Context();
        context.config = this.config;
        context.req = req;
        context.res = res;
        context.user = new types_1.UserInfo();
        let errorObj = null;
        try {
            if (!this.config.entities.hasOwnProperty(entity)) {
                throw { "tag": "1a83", "statusCode": 400, "msg": "invalid entity " + entity };
            }
        }
        catch (ex2) {
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
    initializeConfig(inputConfig) {
        this.config = inputConfig;
        // merge defaultFields into the this.config
        for (const entityName in this.config.entities) {
            if (!this.config.entities.hasOwnProperty(entityName) || defaultEntities[entityName])
                continue;
            this.config.entities[entityName].fields = Object.assign({}, defaultFields, this.config.entities[entityName].fields);
        }
        // merge defaultEntities into the this.config
        for (const defaultEntityName in defaultEntities) {
            if (!defaultEntities.hasOwnProperty(defaultEntityName))
                continue;
            const defaultEntity = defaultEntities[defaultEntityName];
            if (this.config.entities[defaultEntityName]) {
                const entityClone = JSON.parse(JSON.stringify(defaultEntity));
                this.config.entities[defaultEntityName] = entityClone;
            }
            else {
                this.config.entities[defaultEntityName] = defaultEntity;
            }
        }
    }
}
;
const contextFactory = new ContextFactory();
exports.contextFactory = contextFactory;
