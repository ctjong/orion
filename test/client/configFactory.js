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
                        "firstname": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
                        "lastname": { type: "string", isEditable: true, createReq: 2, foreignKey: null }
                    }
                },
                "item":
                {
                    fields:
                    {
                        "name": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
                        "date": { type: "int", isEditable: true, createReq: 2, foreignKey: null }
                    },
                    allowedRoles: 
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
                        "recipientid": { type: "int", isEditable: false, createReq: 2, foreignKey: { targetEntityName: "user", resolvedKeyName: "recipient", isManyToMany: false }},
                        "text": { type: "string", isEditable: false, createReq: 2, foreignKey: null },
                        "flagged": { type: "boolean", isEditable: true, createReq: 0, foreignKey: null }
                    },
                    allowedRoles: 
                    {
                        "read": ["member", "admin"],
                        "create": ["member", "admin"],
                        "update": ["member", "admin"],
                        "delete": ["admin"]
                    },
                    getReadCondition: (roles[], userId) =>
                    {
                        if(roles.indexOf("admin") >= 0)
                            return "";
                        return "ownerid=" + userId + "|recipientid=" + userId;
                    },
                    isWriteAllowed: (action, roles[], userId, dbResource, inputResource) =>
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
export { configFactory };