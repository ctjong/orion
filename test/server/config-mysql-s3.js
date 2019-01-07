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
        awsAccessKeyId: "testAwsAccessKeyId",
        awsSecretAccessKey: "testAwsSecretAccessKey",
        s3Bucket: "testS3BucketName"
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
                "recipientid": { type: "int", isEditable: false, isRequired: true, foreignKey: { targetEntityName: "user", resolvedEntityName: "recipient" }},
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
            readValidator: function(roles, userId)
            {
                if(roles.indexOf("admin") >= 0)
                    return "";
                return "ownerid=" + userId + "|recipientid=" + userId;
            },
            writeValidator: function(action, roles, userId, dbResource, inputResource)
            {
                if(action !== "update" || roles.indexOf("admin") >= 0)
                    return true;
                return userId === dbResource.recipientid;
            }
        }
    },
};