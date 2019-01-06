# Orion Documentation

- [Home](../)
- [Sample Blog App](sample-blog-app)
- [API Endpoints](api-endpoints)
- [Configuration Options](configuration-options)
- [Sample Configuration](sample-configuration)
- [Authentication](authentication)
- [User Roles](user-roles)
- [Condition Syntax](condition-syntax)
- [API Reference](api-reference)

## Sample Configuration

```js
{
    database:
    {
        dialect: "mssql",
        host: _DATABASE_HOST_,
        name: _DATABASE_NAME_,
        userName: _DATABASE_USERNAME_,
        password: _DATABASE_PASSWORD_
    },
    auth: 
    {
        tokenLifetimeInMins: 5,
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
        appInsightsKey: process.env.SAMPLE_APPINSIGHTS_INSTRUMENTATIONKEY
    },
    entities:
    {
        // Extend the default user entity by adding new fields "dateofbirth" and "cityofbirth"
        "user":
        {
            fields:
            {
                "dateofbirth": { type: "string", isEditable: true, isRequired: true, foreignKey: null },
                "cityofbirth": { type: "string", isEditable: true, isRequired: true, foreignKey: null }
            }
        },

        // An item entity, only readable and modifiable by owner
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

        // An entity representing a chat message
        "message":
        {
            // only the 'flagged' is editable, to allow the message recipient to flag it 
            // if it contains inappropariate content
            fields:
            {
                "recipientid": { type: "int", isEditable: false, isRequired: true, foreignKey: { targetEntityName: "user", resolvedEntityName: "recipient" }},
                "text": { type: "string", isEditable: false, isRequired: true, foreignKey: null },
                "flagged": { type: "boolean", isEditable: true, isIgnoredOnCreate: true, foreignKey: null }
            },

            // allow members to read, create, update, but not delete. 
            // more granular permission check for read and update is applied in the readValidator and writeValidator.
            permissions: 
            {
                "read": ["member", "admin"],
                "create": ["member", "admin"],
                "update": ["member", "admin"],
                "delete": ["admin"]
            },

            // we only allow read access to the sender (owner) and the recipient, and the site admin.
            readValidator: (roles, userId) =>
            {
                if(roles.indexOf("admin") >= 0)
                    return "";
                return "ownerid=" + userId + "|recipientid=" + userId;
            },

            // we only allow update access to the recipient (to flag the message) and the site admin.
            writeValidator: (action, roles, userId, dbRecord, inputRecord) =>
            {
                if(action !== "update" || roles.indexOf("admin") >= 0)
                    return true;
                return userId === dbRecord.recipientid;
            }
        }
    },
};
```