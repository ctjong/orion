import { IFieldSetConfig, IEntitySetConfig } from "./types";

const defaultFieldsConfig : IFieldSetConfig =
{
    "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
    "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" } },
    "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
};

const defaultEntitiesConfig : IEntitySetConfig =
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

export { defaultFieldsConfig, defaultEntitiesConfig };