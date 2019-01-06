class ConfigFactory
{
    create(dbDialect, storageSetting)
    {
        const config = 
        {
            database: 
            {
                dialect: dbDialect,
                host: "host",
                name: "name",
                userName: "userName",
                password: "password"
            },
            auth: 
            {
                tokenLifetimeInMins: 5,
                secretKey: "samplestring",
                salt: "samplestring",
                passwordReqs:
                {
                    minLength: 8,
                    uppercaseChar: false,
                    lowercaseChar: false,
                    digitChar: false,
                    specialChar: false
                }
            },
            storage: storageSetting,
            entities:
            {
                "user":
                {
                    fields:
                    {
                        "firstname": { type: "string", isEditable: true, isRequired: true, foreignKey: null },
                        "lastname": { type: "string", isEditable: true, isRequired: true, foreignKey: null }
                    }
                },
                "item":
                {
                    fields:
                    {
                        "name": { type: "string", isEditable: true, isRequired: true, foreignKey: null },
                        "date": { type: "int", isEditable: true, isRequired: true, foreignKey: null }
                    },
                    permissions: 
                    {
                        "read": ["owner", "admin"],
                        "create": ["member"],
                        "update": ["owner", "admin"],
                        "delete": ["owner", "admin"]
                    }
                },
                "message":
                {
                    fields:
                    {
                        "recipientid": { type: "int", isEditable: false, isRequired: true, foreignKey: { targetEntityName: "user", resolvedEntityName: "recipient", isManyToMany: false }},
                        "text": { type: "string", isEditable: false, isRequired: true, foreignKey: null },
                        "flagged": { type: "boolean", isEditable: true, isIgnoredOnCreate: true, foreignKey: null }
                    },
                    permissions: 
                    {
                        "read": ["member", "admin"],
                        "create": ["member", "admin"],
                        "update": ["member", "admin"],
                        "delete": ["admin"]
                    },
                    readValidator: (roles, userId) =>
                    {
                        if(roles.indexOf("admin") >= 0)
                            return "";
                        return "ownerid=" + userId + "|recipientid=" + userId;
                    },
                    writeValidator: (action, roles, userId, dbResource, inputResource) =>
                    {
                        if(action !== "update" || roles.indexOf("admin") >= 0)
                            return true;
                        return userId === dbResource.recipientid;
                    }
                }
            },
        };
        return config;
    }
};


const configFactory = new ConfigFactory();
module.exports = { configFactory };