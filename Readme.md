# Orion API

[![npm](https://img.shields.io/npm/dt/orion-api.svg)]() [![npm](https://img.shields.io/npm/v/orion-api.svg)]() [![David](https://img.shields.io/david/ctjong/orion.svg)]()

Orion allows you to build a REST API app in just a few steps! This library is to be used in combination with Node and Express. It sets up all the necessary CRUD data endpoints, file uploads, authentication endpoints, and error handling.

The latest version of the library supports the following components:
- Database: **SQL Server**
- Storage: **Azure Blob Storage**
- Authentication: **First Party**, **Facebook**
- Monitoring: **Azure Application Insights**

In this documentation:
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Client Usage](#client-usage)
  - [Data Endpoints](#data-endpoints)
  - [File Uploads](#file-uploads)
  - [Authentication](#authentication)
  - [Error logging](#error-logging)
- [Condition Syntax](#condition-syntax)
- [License](#license)

## Getting Started

1. Set up a folder for your NodeJS application.
2. Install Express and Orion to your application and save it to package.json.
    ```bash
    $ npm install --save express
    $ npm install --save orion-api
    ```
3. Create a configuration module. Please see the [configuration](#configuration) section below for more details.
4. (Optional) Set up database tables based on the configuration you created (if you haven't), using Orion's setup.js. The script is located at the root path of the Orion module source code. It takes the configuration file path and the output file path as arguments.
    ```bash
    $ node node_modules/orion-api/setup.js ./config.js ./setup.sql
    ```
    The above command will create a SQL server query file named setup.sql that you can run on the database server to set up the tables.
5. Set up *server.js* for the application entry point. Import Express, Orion, and the configuration module you created, and set up the application as follows:
    ```js
    var express = require('express');
    var orion = require('orion-api');
    var config = require('./config');

    var app = new express();
    orion.setConfig(config);
    orion.setupApiEndpoints(app);
    orion.startApiApp(app);
    ```
6. You're all set up! You can now run server.js to see your app in action. Unless you specify a port in the startApiApp() call, you will see your app running at port 1337.
    ```bash
    $ node server.js 
    $ # your app should now run at http://localhost:1337
    ```

## Configuration

A configuration module is required to give the application the necessary information about your project. This module should specify the connection strings, authentication and authorization settings, user roles and access levels, and most importantly, the data models.

Below is the list of settings to be included in a configuration module:
- **database** - (Required) Database configuration
    - **system** - (Optional) Database management system to use. Currently we only support "mssql". Default to "mssql".
    - **connectionString** - (Required) Connection string to connect with database
- **auth** - (Optional) Authentication configuration. Required if you want to enable authentication.
    - **secretKey** - (Required) Secret key for token encryption.
    - **salt** - (Optional) Salt string for password encryption. Required if you want to support first party authentication.
    - **passwordReqs** - (Optional) New password requirements. Required if you want to support first party authentication.
        - **minLength** - (Required) Minimum number of characters in a password (integer).
        - **uppercaseChar** - (Required) Whether or not a password should contain an uppercase character (true/false).
        - **lowercaseChar** - (Required) Whether or not a password should contain an lowercase character (true/false).
        - **digitChar** - (Required) sWhether or not a password should contain a digit character (true/false).
        - **specialChar** - (Required) Whether or not a password should contain an special character (true/false).
- **storage** - (Optional) Configuration for file upload. Required if you want to support file uplaod.
    - **system** - (Optional) Storage system to use. Currently we only support "azure" (Azure Blob Storage). Default to "azure".
    - **azureStorageConnectionString** - (Optional) Azure Blob Storage connection string. Required if you want to use Azure Blob Storage.
    - **azureStorageContainerName** - (Optional) Azure Blob Storage account name. Required if you want to use Azure Blob Storage.
- **monitoring** - (Optional) Configuration for monitoring system. Required if you want to monitor traffic to the application.
    - **appInsightsKey** - (Optional) Azure Application Insights key. Required if you want to use Application Insights.
- **entities** - (Required) An object that contains a list of data entities (tables). The object keys would be the entity names, and the object valuse would be the [entity configurations](#entity-configuration). The entity name should contain no space, and preferably be all lowercase to make it consistent with the names in the database system.

#### Entity configuration

The entity configuration is an object that should contain the following properties:
- **fields** - (Required) An object that contains a list of fields in the entity. The object keys would be the field names and the object values would be the [field configurations](#field-configuration). Similar to entity name, the field name should also contain no space, and preferably be all lowercase to make it consistent with the names in the database system.
- **allowedRoles** - (Required) An object that specify which user roles are allowed to do certain operation. The key of the object should be the operation name (create/read/update/delete) and the value should be an array of roles.
- **getReadCondition** - (Optional) A function to be invoked at the beginning of each read (GET) operation. This function takes the user roles and user ID as arguments, and returns a condition string to be added to the database read query. This is useful if you need a more granular permission rule in addition to the **allowedRoles** list above. For examnple, if you want to only allow read access to a member that is more than 20 years old, you can put the role "member" in the **allowedRoles** and add a function here that returns condition "age>20". See [Condition Syntax](#condition-syntax) for more details on how to write the condition.
- **isWriteAllowed** - (Optional) A function to be invoked at the beginning of each write (POST/PUT/DELETE) request. This function takes as arguments the action name, user roles, user ID, resource object from DB, and resource object from user, and it returns a boolean, whether or not to allow the request. This is useful if you need a more granular permission check in addition to the **allowedRoles**. For example, if you want to only give update access to member that lives in Seattle, you can put "member" in the **allowedRoles** and add a function here that returns true only if city == "Seattle".

#### Field configuration

#### Validator function rule

#### Sample configuration

```js
"item":
{
    fields:
    {
        // The key to each object here will be the field name. We suggest that you
        // use all lowercase for the field name.

        // (Required) id of the resource. This has to have the type "id" and will be 
        // given the primary key constraint. See the ownerid field for more details on
        // the properties inside the field object.
        "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
 
        // (Required) Owner of the resource. When the resource is created, this field 
        // will be set automatically to the creator ID.
        "ownerid": 
        {
            // (Required) the type of the field
            // The supported types are:
            // "id"        : ID of the resource, primary key, needs to be unique.
            // "string"    : plain text, max 255 characters. default to null.
            // "text"      : rich text, no maximum. default to null. Note that this 
            //               field will only be returned on individual item retrieval.
            // "int"       : integer. default to 0.
            // "float"     : floating point numbers. default to null.
            // "boolean"   : boolean type (0/1). default to 0.
            // "timestamp" : timestamp type. Will be stored in JS's integer time
            //               format (the number of ms since Jan 1, 1970).
            type: "int",

            // (Required) whether or not this field is editable in PUT action.
            isEditable: false,

            // (Required) specify the requirement for this field in POST action.
            // Possible values:
            // 0 : This field is not required in POST body.
            // 1 : This field is optional and may be included in POST body.
            // 2 : This field is required in POST body. Failure to supply this value 
            //     in POST will result in an error response.
            createReq: 0,

            // (Required) Specify whether this field is a foreign key to another 
            // entity. Set to null if it is not.
            foreignKey: 
            {
                // (Required) Name of the entity that this field is referring to.
                // For example, the field we're at now is the ownerid field, which
                // refers to the user entity.
                foreignEntity: "user",
                        
                // (Required) The field name shown after the foreign key is resolved.
                // The GET handler resolves 1 foreign key level. So if you for instance
                // make a findbyid request to this item entity, the app will resolve
                // this ownerid field (since it is marked as a foreign key) and replace
                // it with a user object. The value of this resolvedKeyName will be 
                // the key to that object, so the output will be like:
                // { "id": "1", "owner": { "id": 2", ... }, ... }
                resolvedKeyName: "owner" 
            }
        },

        // (Optional) Timestamp of the resource creator. When the resource is created, 
        // this field will be set automatically to the time of the creation.
        "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }

        // You can add more fields to the entity
        "name": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
        "date": { type: "int", isEditable: true, createReq: 2, foreignKey: null }
    },
    readConditionStrings: 
    [
        { 
            // (Required) A set of user roles that this rule applies to.
            // For GET requests, "owner" role is given automatically in private mode.
            // This automatically adds ownerid=[activeUserId] condition to the database
            // read operation.
            roles: ["owner", "admin"], 

            // (Required) A function that returns the condition string.
            // This function takes the active user as argument.
            // If this returns empty string return, no condition will be added so all 
            // requested data will be returned.
            fn: function(u) { return ""; } 
        }
    ],
    validators:
    {
        // (Required) Validator functions for POST requests.
        create: 
        [
            // Each object in this array represents a rule that is applied to a 
            // certain set of user roles.

            {
                // (Required) A set of user roles that this rule applies to.
                roles: ["member"],

                // (Required) The validator function. Based on the supplied arguments, 
                // this should return true if the request is valid, and false 
                // otherwise. The validator for POST takes one argument, the newly 
                // submitted object.
                fn: function(n) { return true; } 
            }
        ],

        // (Required) Validator functions for PUT requests.
        update: 
        [
            { 
                roles: ["owner", "admin"], 

                // The validator for PUT takes three arguments, the active user object,
                // the current data object, and the updated data object.
                fn: function(u, o, n) { return true; } 
            }
        ],

        // (Required) Validator functions for DELETE requests.
        delete: 
        [
            { 
                roles: ["owner", "admin"], 

                // The validator for DELETE takes one argument, the data object to be 
                // deleted.
                fn: function(o) { return true; } 
            }
        ]
    }
},

// This is a special entity/table for storing user data. This is required if you want 
// to enable authentication. All fields listed here are required, and you can add more 
// to it if needed. You can also modify the condition strings and the validators.
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
        "firstname": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
        "lastname": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
        "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
    },
    readConditionStrings: [{ roles: ["member", "owner", "admin"], fn: function(u) { return ""; } }],
    validators:
    {
        create: [{ roles: ["guest"], fn: function(n) { return true; } }],
        update: [{ roles: ["owner", "admin"], fn: function(u, o, n) { return true; } }],
        delete: [{ roles: ["admin"], fn: function(o) { return true; } }]
    }
},

// This is another special entity/table that is used for keeping track of uploaded 
// files. It is required if you want to enable file upload. All fields listed here
// are required. You can modify the condition strings and the validators if needed.
"asset":
{
    fields:
    {
        "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
        "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" }},
        "filename": { type: "string", isEditable: true, createReq: 2, foreignKey: null }
    },
    readConditionStrings: [{ roles: ["owner", "admin"], fn: function(u) { return ""; } }],
    validators:
    {
        create: [{ roles: ["member"], fn: function(n) { return true; } }],
        update: [],
        delete: [{ roles: ["owner", "admin"], fn: function(o) { return true; } }]
    }
},

// You can add as many more entities as needed. This one below is an example entity
// that represents a chat message, to help you better understand how to use the 
// condition strings and validators to control resource access.
"message":
{
    fields:
    {
        // We are setting all fields to be uneditable, except for the flagged field,
        // because we want to let people flag inappropriate messages.
        "id": { type: "id", isEditable: false, createReq: 0, foreignKey: null },
        "ownerid": { type: "int", isEditable: false, createReq: 0, foreignKey: { foreignEntity: "user", resolvedKeyName: "owner" }},
        "recipientid": { type: "int", isEditable: false, createReq: 2, foreignKey: { foreignEntity: "user", resolvedKeyName: "recipient" }},
        "text": { type: "string", isEditable: false, createReq: 2, foreignKey: null },
        "flagged": { type: "boolean", isEditable: true, createReq: 0, foreignKey: null },
        "createdtime": { type: "timestamp", isEditable: false, createReq: 0, foreignKey: null }
    },
    readConditionStrings:
    [
        // Unauthenticated users (guest) cannot access private chat messages, so guest
        // role is not listed here. Regular authenticated users (member) is allowed to
        // access only messages that they send or receive. So for member role we're 
        // adding a condition string to make sure the ownerid or recipientid
        // matches the active user id.
        {
            roles: ["member"],
            fn: function(u) { return "ownerid=" + u + "|recipientid=" + u; } 
        },

        // Admin role has full access to all chat messages.
        { roles: ["admin"], fn: function(u) { return ""; } }
    ],
    validators:
    {
        // Same as before, unauthenticated users (guest) cannot modify private chat 
        // messages, so guest role is not listed here. Regular logged in users (member)
        // are allowed to create messages so we're returning true here.
        create: [{ roles: ["member"], fn: function(n) { return true; } }],

        // We are allowing only chat recipients to flag a message. Therefore for PUT 
        // requests we are checking if the active user is the chat recipient. If not
        // then the request is invalid.
        update: [{ roles: ["member"], fn: function(u, o, n) { return u === o.recipientid; } }],

        // We are only allowing admins to delete messages.
        delete: [{ roles: ["admin"], fn: function(o) { return true; } }]
    }
}
```



## Client Usage

#### Data Endpoints

#### File Uploads

#### Authentication

#### Error Logging

## Condition Syntax

## License

(The MIT License)

Copyright (c) 2017 Christopher Tjong <christophertjong@hotmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
