# Orion API

[![npm](https://img.shields.io/npm/dt/orion-api.svg)]() [![npm](https://img.shields.io/npm/v/orion-api.svg)]() [![David](https://img.shields.io/david/ctjong/orion.svg)]()

Orion is a configurable server application, which allows you to build a fully functional REST API in just a few steps! This library is built on top of [Express](https://expressjs.com/). It sets up all the necessary CRUD data endpoints, file uploads, authentication endpoints, and error handling.

The latest version of the library supports the following components:
- Database: **SQL Server**, **MySQL**
- Storage: **Azure Blob Storage**, **Amazon S3**, **Local Server**
- Authentication: **First Party**, **Facebook**
- Monitoring: **Azure Application Insights**

In this documentation:
- [Create Your First Orion Application](#create-your-first-orion-application)
- [Configuration](#configuration)
    - [Entity Configuration](#entity-configuration)
    - [Field Configuration](#field-configuration)
    - [Default Fields](#default-fields)
    - [Default Entities](#default-entities)
    - [Sample Full Configuration](#sample-full-configuration)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [Condition Syntax](#condition-syntax)
- [API Reference](#api-reference)
- [Contributing](https://github.com/ctjong/orion/tree/master/CONTRIBUTING.md)
- [License](https://github.com/ctjong/orion/tree/master/LICENSE)

## Create Your First Orion Application

1. Set up a folder for your server application.
2. Install Orion to your application.
    ```bash
    $ npm install --save orion-api
    ```
3. Create a configuration module. This should contain all the settings for your application, and what entities/tables you want to have in the database. For instance, if you only want to have one table for storing blog posts, you can have the following configuration:
    ```js
    module.exports =
    {
        database:
        {
            engine: "mssql",
            connectionString: _DATABASE_CONNECTION_STRING_
        },
        entities:
        {
            "blogpost":
            {
                "fields":
                {
                    "title": { type: "string", isEditable: true, createReq: 2, foreignKey: null },
                    "content": { type: "richtext", isEditable: true, createReq: 2, foreignKey: null }
                },
                "allowedRoles":
                {
                    "read": ["guest"],
                    "create": ["guest"],
                    "update": ["guest"],
                    "delete": ["guest"]
                }
            }
        }
    }
    ```
    Please see the [configuration](#configuration) section for more configuration options.
4. Set up database tables based on the configuration you created using our setup script. The script is located at the root of the Orion module folder. It takes the configuration file path and the output file path as arguments. Note that the input and output paths have to be absolute paths.
    ```bash
    $ node node_modules/orion-api/setup.js ~/appPath/config.js ~/appPath/setup.sql
    ```
    The above command will create an SQL query file named setup.sql that you can run on the database server to set up the tables.
5. Set up **server.js** for the application entry point. Import Orion and the configuration module, and set up the application as follows:
    ```js
    var orion = require('orion-api');
    var config = require('./config');

    var app = orion.create(config);
    
    // You can add more endpoints to the app object or do other things here
    
    app.start();
    ```
6. You're all set! You can now run server.js to see your app in action. Unless you specify a port in the start() call, you will see your app running at port 1337.
    ```bash
    $ node server.js
    ```
    For the blog post example above, you can test it by running a POST to add a blog post entry and GET to retrieve it.
    ```bash
    $ # insert a new blog post entry
    $ curl -d '{"title":"I like trains", "content":"Trains are cool!"}' -H "Content-Type: application/json" -X POST http://localhost:1337/api/data/blogpost
    $
    $ # retrieve all blog post entries
    $ curl http://localhost:1337/api/data/blogpost/public/findall/id/0/100
    ```
    Go to [API Endpoints](#api-endpoints) section to see all of the endpoints that we provide.

## Configuration

A configuration module is required to give the application the necessary information about your project. This module should specify the connection strings, authentication and authorization settings, user roles and access levels, and most importantly, the data models.

Below is the list of settings to be included in a configuration module:
- **database** - (Required) Database configuration
    - **engine** - (Required) Database engine to use (mssql/mysql).
    - **connectionString** - (Required) Connection string to connect with database
- **auth** - (Optional) Authentication configuration. Required if you want to enable authentication.
    - **secretKey** - (Required) Secret key for token encryption.
    - **salt** - (Optional) Salt string for password encryption. Required if you want to support first party authentication.
    - **tokenLifetimeInMins** - (Optional) Token lifetime in minutes. If not provided, the token will be set to never expire.
    - **passwordReqs** - (Optional) New password requirements. Required if you want to support first party authentication.
        - **minLength** - (Required) Minimum number of characters in a password (integer).
        - **uppercaseChar** - (Required) Whether or not a password should contain an uppercase character (true/false).
        - **lowercaseChar** - (Required) Whether or not a password should contain an lowercase character (true/false).
        - **digitChar** - (Required) sWhether or not a password should contain a digit character (true/false).
        - **specialChar** - (Required) Whether or not a password should contain an special character (true/false).
- **storage** - (Optional) File upload configuration. Required if you want to support file upload.
    - **provider** - (Required) Storage provider to use (azure/s3/local).
    - **azureStorageConnectionString** - (Optional) Azure Blob Storage connection string. Required if you want to support file upload to Azure Blob Storage.
    - **azureStorageContainerName** - (Optional) Azure Blob Storage account name. Required if you want to use Azure Blob Storage.
    - **awsAccessKeyId** - (Optional) AWS Access Key ID to access an Amazon S3 account. Required if you want to support file upload to Amazon S3.
    - **awsSecretAccessKey** - (Optional) AWS Secret Access Key to access an Amazon S3 account. Required if you want to support file upload to Amazon S3.
    - **s3Bucket** - (Optional) Amazon S3 bucket name. Required if you want to support file upload to Amazon S3.
    - **uploadPath** - (Optional) Path in the local server where you want to store uploaded files into, relative to the root of the application. Required if you want to support file upload to the local server.
- **monitoring** - (Optional) Configuration for monitoring system. Required if you want to monitor traffic to the application.
    - **appInsightsKey** - (Optional) Azure Application Insights key. Required if you want to use Application Insights.
- **entities** - (Required) An object that contains a list of data entities (tables). Each entry in the object should be a mappings from an entity name to an [entity configuration](#entity-configuration) object. The entity name should contain no space, and preferably be all lowercase to make it consistent with the names in the database system.

#### Entity Configuration

Here are the properties that must/may be included in an entity configuration object:
- **fields** - (Required) An object that contains a list of fields in the entity. Each entry in the object should be a mapping from a field name to a [field configuration](#field-configuration) object. Similar to entity name, the field name should also contain no space, and preferably be all lowercase to make it consistent with the names in the database system.
- **allowedRoles** - (Required) An object that specify which user roles are allowed to do a certain operation. Each entry in the object should be a mapping from an operation name (create/read/update/delete) to an array of user roles. See [User Roles](#user-roles) for more info on what the user roles can be.
- **getReadCondition** - (Optional) A function to be invoked at the beginning of each read (GET) operation. This function passes in as parameters the user roles and user ID, and should return a condition string to be added to the database read query. This is useful if you need a more granular permission rule in addition to the **allowedRoles** list above. For examnple, if you want to allow read access only to members who are more than 20 years old, you can put the role "member" in the **allowedRoles** and add a **getReadCondition** function that returns condition "age>20". See [Condition Syntax](#condition-syntax) for more details on how to write the condition.
- **isWriteAllowed** - (Optional) A function to be invoked at the beginning of each write (POST/PUT/DELETE) request. This function passes in as parameters the action name, user roles, user ID, record object from DB, and record object from user, and it should return a boolean, whether or not to allow the request. This is useful if you need a more granular permission check in addition to the **allowedRoles**. For example, if you want to allow update access only to members who live in Seattle, you can put "member" in the **allowedRoles** and add an **isWriteAllowed** function that returns true only if city == "Seattle".

#### Field Configuration

Here are the properties that must/may be included in a field configuration object:
- **type** - (Required) The data type of the field. Here are the options:
    - **string** : plain text, max 255 characters
    - **text**: rich text, no maximum. This type of field will only be returned on individual item retrieval (findbyid GET requests)
    - **int** : integer, default to 0.
    - **float** : floating point number, default to null.
    - **boolean** : boolean type (0/1), default to 0.
    - **secret** : password type, max 255 characters. This type of field will be hidden from GET requests.
- **isEditable** : (Required) Whether or not this field is editable by PUT requests (true/false).
- **createReq** : (Required) Whether or not this field must be included in a POST body. The possible values are:
    - **0** : The field will be ignored when a POST request is processed.
    - **1** : The field is optional, it will be processed if it is included in a POST body.
    - **2** : The field is required, it must be included in a POST body. If not a 400 response code will be returned.
- **foreignKey** : (Optional) Foreign key configuration, required if the field is a foreign key to another entity. The configuration includes the following properties:
    - **foreginEntity** - (Required) the entity name that the field is linked to. The value of the field will be matched with the "id" field of the target entity.
    - **resolvedKeyName** - (Required) The library resolves one level of foreign key relationship for a GET request. The resolved object will be appended to the response object, with the value of this **resolvedKeyName** as key. For instance, if entity "blogpost" has field "authorId" that is a foreign key to entity "user" and has **resolvedKeyName** value "author", then an item in a GET response will look something like:
        ```
        {
            id: 123
            title: "Roses are red"
            authorId: 456 
            author: 
            {
                id: 456,
                name: "John Doe"
            }
        }
        ```

#### Default Fields

These are some fields that we add to the config at runtime, both when an SQL query is being constructed using setup.js and when an actual API app is being initialized.

| name | value | type | isEditable |  createReq | foreignEntity | resolvedKeyName
| - | - | - | - | - | - | - 
| id | id of the record | id | false | 0 | null | null
| ownerid | id of the record owner | int | false | 0 | user | owner
| createdtime | timestamp of the record creation | timestamp | false | 0 | null | null

The data types "id" and "timestamp" are special types reserved only for fields "id" and "createdtime". We add the default fields above to every entity specified in the config, except those that are part of the [default entities](#default-entities). Default fields cannot be overridden, so if a field with the same name as one of the default fields exists in the config, that field will be ignored.


#### Default Entities

There are also some entities that we add to the config at runtime, both when an SQL query is being constructed using setup.js and when an actual API app is being initialized.

- **user** - User entity for storing user information. This entity will be used if authentication is enabled.
    - **fields**
    
        | name | value | type | isEditable |  createReq | foreignEntity | resolvedKeyName
        | - | - | - | - | - | - | - 
        | id | user id | id | false | 0 | null | null
        | domain | domain where user info is hosted | string | false | 0 | null | null
        | domainid | user id on its domain | string | false | 0 | null | null
        | roles | user roles (comma separated) | string | false | 0 | null | null
        | username | username | string | true | 2 | null | null
        | password | password | secret | true | 2 | null | null
        | email | email | string | true | 2 | null | null
        | firstname | first name | string | true | 1 | null | null
        | lastname | last name | string | true | 1 | null | null
        | createdtime | timestamp of the record creation | timestamp | false | 0 | null | null
        
    - **allowedRoles**
    
        | action | roles
        | - | - 
        | read | member, owner, admin
        | create | guest
        | update | owner, admin
        | delete | admin
        
- **asset** - Asset entity to be used for keeping track of uploaded files. Will be used if file upload is enabled.
    - **fields**
    
        | name | value | type | isEditable |  createReq | foreignEntity | resolvedKeyName
        | - | - | - | - | - | - | - 
        | id | id of the record | id | false | 0 | null | null
        | ownerid | id of the record owner | int | false | 0 | user | owner
        | filename | file name of the asset | string | false | 2 | null | null
        
    - **allowedRoles**
    
        | action | roles
        | - | - 
        | read | owner, admin
        | create | member
        | update | 
        | delete | owner, admin

 The existing fields in the default entities above cannot be overriden, but the list itself can be extended. For instance, in the config you can specify additional fields "firstname" and "lastname" for the user entity. The allowedRoles can be overriden, so in the config you can specify your own permission rules for any of the default entities. You can also specify a getReadCondition and an isWriteAllowed functions for a default entity. 


#### Sample Full Configuration

Here is a sample configuration that utilize the provided features (authentication, storage, granular permission checks). You can find it [here](https://github.com/ctjong/orion/blob/master/config-sample.js).


## API Endpoints

- **GET /api/data/:entity/:accessType/findbyid/:id**

    Retrieve a record by its ID.

    Headers:
    - **Authorization** - Required only if the access type is private. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Parameters:
    - **entity** - Name of the entity where the record is in.
    - **accessType** - The mode of access:
        - **private** - The requester is the owner of the record. An Authorization header is required.
        - **public** - The requester is not the owner of the record, or not trying to access it as its owner.
    - **id** - Id of the requested record.

    Success response:
    - **count** - Number of items found matching the requested details. This value should always be 1 for this endpoint.
    - **items** - An array of items found. Each item will be a JSON object, with 1 level of foreign key resolved.

- **GET /api/data/:entity/:accessType/findbycondition/:orderByField/:skip/:take/:condition**

    Retrieve records that match a certain set of conditions.

    Request headers:
    - **Authorization** - Required only if the access type is private. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in.
    - **accessType** - The mode of access:
        - **private** - The requester is the owner of the record. An Authorization header is required.
        - **public** - The requester is not the owner of the record, or not trying to access it as its owner.
    - **orderByField** - The field to order the results by. You can add "~" in front of the field name to sort in descending order.
    - **skip** - Number of records to skip. Used for pagination.
    - **take** - Number of records to take. Used for pagination.
    - **condition** - Condition string to find the target records. See [Condition Syntax](#condition-syntax) for more details on how to write the condition.

    Success response:
    - **count** - Number of items found matching the requested details. This value should always be 1 for this endpoint.
    - **items** - An array of items found. Each item will be a JSON object, with 1 level of foreign key resolved.

- **GET /api/data/:entity/:accessType/findall/:orderByField/:skip/:take**

    Retrieve all records in a certain entity.

    Request headers:
    - **Authorization** - Required only if the access type is private. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in.
    - **accessType** - The mode of access:
        - **private** - The requester is the owner of the record. An Authorization header is required.
        - **public** - The requester is not the owner of the record, or not trying to access it as its owner.
    - **orderByField** - The field to order the results by. You can add "~" in front of the field name to sort in descending order.
    - **skip** - Number of records to skip. Used for pagination.
    - **take** - Number of records to take. Used for pagination.

    Success response:
    - **count** - Number of items found matching the requested details. This value should always be 1 for this endpoint.
    - **items** - An array of items found. Each item will be a JSON object, with 1 level of foreign key resolved.

- **POST /api/data/asset**

    Upload a file into the file storage (specified in the config) and add a database entry for it.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request body:
    - **file** - File to upload

    Success response: The inserted asset ID

- **POST /api/data/:entity**

    Add a new record to an entity.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity to put the record in.

    Request body:
    JSON object representation of the new record

    Success response: The inserted ID

- **PUT /api/data/:entity/:id**

    Update a record in an entity.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in
    - **id** - Id of the record to update

    Request body:
    JSON object representation of the new record

    Success response: 200 status code

- **DELETE /api/data/asset/:id**

    Delete an uploaded file from the file storage and from database.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request parameters:
    - **id** - Id of the asset to delete

    Success response: 200 status code

- **DELETE /api/data/:entity/:id**

    Delete a record from an entity.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](#authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in
    - **id** - Id of the record to delete

    Success response: 200 status code

- **POST /api/auth/token**

    Get an access token using a set of login credentials. This can be used if all first party authentication settings are specified in the config. See [Authentication](#authentication) section for more details.

    Request body:
    - **username** - Submitted user name 
    - **password** - Submitted password

    Success response:
    - **token** - Access token
    - **id** - User ID
    - **firstname** - User's first name
    - **lastname** - User's last name

- **POST /api/auth/token/fb**

    Get an access token using a temporary Facebook token. See [Authentication](#authentication) section for more details.

    Request body:
    - **fbtoken** - Facebook token

    Success response:
    - **token** - The access token
    - **id** - User ID
    - **firstname** - User's first name
    - **lastname** - User's last name

- **POST /api/error**

    Log an error message. The logs will be stored in a table called "errortable" in the database. There is currently no built-in endpoint for retrieving these logs, so it would have to be manually retrieved by database admin.

    Request body:
    - **msg** - Error message

    Success response: 200 status code


## Authentication

The library is using OAuth mechanism to authorize users for accessing certain API resources. This mechanism allows API requests to be executed on behalf of a user using an access token. This token is issued by a certain token provider when the user is logged in / authenticated. The Orion application acts as the token provider in this scenario, and users can request for a token in two ways, by submitting login credentials using the **"POST /api/auth/token"** endpoint, or by submitting a Facebook token using the **"POST /api/auth/token/fb"** endpoint.

After you retrieve the Orion token, you will need to attach it to the header of each API request you make, so typically you would want to store the token in the browser's localStorage/sessionStorage, or in the local app data for mobile apps. The token's lifetime can be controlled in the config (if not specified in the config, the token will be set to never expire). When an expired token is used in a request, it will be treated as if no token is provided, so in most cases a 401 response will be returned and the user will have to log in again.

For Facebook authentication, you need to request for a Facebook token first before exchanging it with Orion token. The way to retrieve the Facebook token depends on the platform of your client app. See [Facebook documentation](https://developers.facebook.com/docs/facebook-login/access-tokens/#usertokens) for more details.


## User Roles

Here is a list of user roles supported by the library. These roles (except admin) are automatically assigned to the requester of each incoming request. A user can have multiple roles (i.e. can be both "member" and "owner").
Role | Description
- | -
guest | Unauthenticated user. Assigned when with no token provided.
member | Authenticated user. Assigned when a valid token is provided.
owner | Owner of the target record. Assigned if the request is a GET in private mode OR if the request is a POST/PUT/DELETE and the target record is owned by the user.
admin | Site administrator. There is no endpoint to assign this to users programmatically, so this needs to be set manually by database admin.


## Condition Syntax

The condition can be written in this format "{fieldName}{comparison-operator}{fieldValue}". Multiple conditions can also be joined to create a compound condition string "{condition1}{logical-operator}{condition2}".

Operators:
- **Comparison operators**: "&sim;", "<>", "<=", ">=", "<", ">", "=".
    The "&sim;" operator can be used for string/text fields, to match strings with a certain substring in it. The other operators can be used for int/float/timestamp fields.
- **Logical operators**: "&" (and), "|" (or)

**Note:** if you want to include the condition string in a URL, it will have to be URL-encoded. This can be done using the "encodeURIComponent()" method in Javascript, or similar method in other languages.

## API Reference

**Orion object**

The object retrieved when requiring the "orion-api" module.

- **Methods**
    - **create(config, initFn)** - Create an Orion application.
        - **param:config** - (Required) Configuration module.
        - **param:initFn** - (Optional) An initializer function. It passes in an OrionApp object as parameter which you can perform action on.
        - **return** - An OrionApp object.
    - **findById(originalReq, entity, id, callback)** - Execute a "find by ID" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
        - **param:originalReq** - (Required) Express Request object.
        - **param:entity** - (Required) Target entity.
        - **param:id** - (Required) Target record id.
        - **param:callback** - (Required) Callback fuction. This passes in a response object as parameter, which has the same structure as the return value of the GET endpoint.
    - **findByCondition(originalReq, entity, orderByField, skip, take, condition, callback)** - Execute a "find by condition" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
        - **param:originalReq** - (Required) Express Request object.
        - **param:entity** - (Required) Target entity.
        - **param:orderByField** - (Required) The field to order the results by. You can add "~" in front of the field name to sort in descending order.
        - **skip** - (Required) Number of records to skip. Used for pagination.
        - **take** - (Required) Number of records to take. Used for pagination.
        - **condition** - (Required) Condition string to find the target records. See [Condition Syntax](#condition-syntax) for more details on how to write the condition.
        - **param:callback** - (Required) Callback fuction. This passes in a response object as parameter, which has the same structure as the return value of the GET endpoint.
    - **findAll(originalReq, entity, orderByField, skip, take, callback)** - Execute a "find all" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
        - **param:originalReq** - (Required) Express Request object.
        - **param:entity** - (Required) Target entity.
        - **param:orderByField** - (Required) The field to order the results by. You can add "~" in front of the field name to sort in descending order.
        - **skip** - (Required) Number of records to skip. Used for pagination.
        - **take** - (Required) Number of records to take. Used for pagination.
        - **param:callback** - (Required) Callback fuction. This passes in a response object as parameter, which has the same structure as the return value of the GET endpoint.

**OrionApp object**

The object retrieved when executing the create() method on an Orion object. This object is an extension of an [Express application object](http://expressjs.com/en/api.html#app). The following properties and methods are included in the object in addition to Express app's default properties and methods.

- **Properties**
    - **express** - [Express module](http://expressjs.com/en/api.html#express).
- **Methods**
    - **start(port)** - Start the application at the given port (if provided).
        - **param:port** - (Optional) Port where the application should listen for incoming requests at. If not provided, the application will use the port listed in the system's environment variable "port". If that is also not provided, the default port 1337 will be used.
