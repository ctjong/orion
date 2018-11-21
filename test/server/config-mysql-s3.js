module.exports = 
{
    database:
    {
        dialect: "mysql",
        host: process.env.DB_HOST,
        name: "oriontest",
        userName: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
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
    storage: 
    {
        provider: "s3",
        awsAccessKeyId: process.env.AWS_ACCESSKEYID,
        awsSecretAccessKey: process.env.AWS_SECRETACCESSKEY,
        s3Bucket: "ct-oriontest"
    },
    monitoring:
    {
        azureAppInsightsKey: "samplestring"
    },
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
                "recipientid": { type: "int", isEditable: false, createReq: 2, foreignKey: { targetEntityName: "user", resolvedKeyName: "recipient" }},
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
            getReadCondition: function(roles, userId)
            {
                if(roles.contains("admin"))
                    return "";
                return "ownerid=" + userId + "|recipientid=" + userId;
            },
            isWriteAllowed: function(action, roles, userId, dbResource, inputResource)
            {
                if(action !== "update" || roles.contains("admin"))
                    return true;
                return userId === dbResource.recipientid;
            }
        }
    },
};