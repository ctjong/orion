module.exports = 
{
    database:
    {
        engine: "mssql",
        connectionString: process.env.SAMPLE_DB_CONNECTION_STRING
    },
    auth: 
    {
        secretKey: process.env.SAMPLE_SECRET_KEY,
        salt: process.env.SAMPLE_SALT,
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
        provider: "azure",
        azureStorageConnectionString: process.env.SAMPLE_STORAGE_CONNECTION_STRING,
        azureStorageContainerName: "oriontest"
    },
    monitoring:
    {
        azureAppInsightsKey: process.env.SAMPLE_APPINSIGHTS_INSTRUMENTATIONKEY
    },
    entities:
    {
        // Extend the default user entity by adding new fields "firstname" and "lastname"
        "user":
        {
            fields:
            {
                "firstname": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
                "lastname": { type: "string", isEditable: true, createReq: 2, foreignKey: null }
            }
        },

        // An item entity, only readable and modifiable by owner
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

        // An entity representing a chat message
        "message":
        {
            // only the 'flagged' is editable, to allow the message recipient to flag it 
            // if it contains inappropariate content
            fields:
            {
                "recipientid": { type: "int", isEditable: false, createReq: 2, foreignKey: { foreignEntity: "user", resolvedKeyName: "recipient" }},
                "text": { type: "string", isEditable: false, createReq: 2, foreignKey: null },
                "flagged": { type: "boolean", isEditable: true, createReq: 0, foreignKey: null }
            },

            // allow members to read, create, update, but not delete. 
            // more granular permission check for read and update is applied in the getReadCondition and isWriteAllowed.
            allowedRoles: 
            {
                "read": ["member", "admin"],
                "create": ["member", "admin"],
                "update": ["member", "admin"],
                "delete": ["admin"]
            },

            // we only allow read access to the sender (owner) and the recipient, and the site admin.
            getReadCondition: function(roles, userId)
            {
                if(roles.contains("admin"))
                    return "";
                return "ownerid=" + userId + "|recipientid=" + userId;
            },

            // we only allow update access to the recipient (to flag the message) and the site admin.
            isWriteAllowed: function(action, roles, userId, dbRecord, inputRecord)
            {
                if(action !== "update" || roles.contains("admin"))
                    return true;
                return userId === dbRecord.recipientid;
            }
        }
    },
};