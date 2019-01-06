import { IFieldConfigSet, IEntityConfigSet } from "./types";

const defaultFieldConfigSet : IFieldConfigSet =
{
    "id": { type: "id", isEditable: false, isIgnoredOnCreate: true, foreignKey: null },
    "ownerid": { type: "int", isEditable: false, isIgnoredOnCreate: true, foreignKey: { targetEntityName: "user", resolvedEntityName: "owner", isManyToMany: false } }
};

const defaultEntityConfigSet : IEntityConfigSet =
{
    "asset":
    {
        fields:
        {
            "id": { type: "id", isEditable: false, isIgnoredOnCreate: true, foreignKey: null },
            "ownerid": { type: "int", isEditable: false, isIgnoredOnCreate: true, foreignKey: { targetEntityName: "user", resolvedEntityName: "owner", isManyToMany: false } },
            "filename": { type: "string", isEditable: false, isRequired: true, foreignKey: null }
        },
        permissions:
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
            "id": { type: "id", isEditable: false, isIgnoredOnCreate: true, foreignKey: null },
            "domain": { type: "string", isEditable: false, isIgnoredOnCreate: true, foreignKey: null },
            "domainid": { type: "string", isEditable: false, isIgnoredOnCreate: true, foreignKey: null },
            "roles": { type: "string", isEditable: false, isIgnoredOnCreate: true, foreignKey: null },
            "username": { type: "string", isEditable: true, isRequired: true, foreignKey: null },
            "password": { type: "secret", isEditable: true, isRequired: true, foreignKey: null },
            "email": { type: "string", isEditable: true, isRequired: true, foreignKey: null },
            "firstname": { type: "string", isEditable: true, isRequired: false, foreignKey: null },
            "lastname": { type: "string", isEditable: true, isRequired: false, foreignKey: null }
        },
        permissions:
        {
            "read": ["member", "owner", "admin"],
            "create": ["guest"],
            "update": ["owner", "admin"],
            "delete": ["admin"]
        }
    },
};

export { defaultFieldConfigSet, defaultEntityConfigSet };