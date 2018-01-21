# Orion API

[![npm](https://img.shields.io/npm/dt/orion-api.svg)]() [![npm](https://img.shields.io/npm/v/orion-api.svg)]() [![David](https://img.shields.io/david/ctjong/orion.svg)]()

Orion allows you to build a REST API app in just a few steps! This library is to be used in combination with Node and Express. It sets up all the necessary CRUD data endpoints, file uploads, authentication endpoints, and error handling.

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
    - [Default Fields and Entities](#default-fields-and-entities)
    - [Sample Complete Configurations](#sample-complete-configurations)
- [API Endpoints](#api-endpoints)
- [File Uploads](#file-uploads)
- [Authentication](#authentication)
- [Error logging](#error-logging)
- [User Roles](#user-roles)
- [Condition Syntax](#condition-syntax)
- [Methods](#methods)
- [License](#license)

## Create Your First Orion Application

1. Set up a folder for your NodeJS application.
2. Install Express and Orion to your application and save it to package.json.
    ```bash
    $ npm install --save express
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
4. Set up database tables based on the configuration you created using our setup script. The script is located at the root of the Orion module folder. It takes the configuration file path and the output file path as arguments.
    ```bash
    $ node node_modules/orion-api/setup.js ./config.js ./setup.sql
    ```
    The above command will create an SQL query file named setup.sql that you can run on the database server to set up the tables.
5. Set up **server.js** for the application entry point. Import Express, Orion, and the configuration module you created, and set up the application as follows:
    ```js
    var express = require('express');
    var orion = require('orion-api');
    var config = require('./config');

    var app = new express();
    orion.setConfig(config);
    orion.setupApiEndpoints(app);
    
    // You can add more endpoints to the app object or do other things here
    
    orion.startApiApp(app);
    ```
6. You're all set! You can now run server.js to see your app in action. Unless you specify a port in the startApiApp() call, you will see your app running at port 1337.
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
- **getReadCondition** - (Optional) A function to be invoked at the beginning of each read (GET) operation. This function takes the user roles and user ID as arguments, and returns a condition string to be added to the database read query. This is useful if you need a more granular permission rule in addition to the **allowedRoles** list above. For examnple, if you want to allow read access only to members who are more than 20 years old, you can put the role "member" in the **allowedRoles** and add a **getReadCondition** function that returns condition "age>20". See [Condition Syntax](#condition-syntax) for more details on how to write the condition.
- **isWriteAllowed** - (Optional) A function to be invoked at the beginning of each write (POST/PUT/DELETE) request. This function takes as arguments the action name, user roles, user ID, resource object from DB, and resource object from user, and it returns a boolean, whether or not to allow the request. This is useful if you need a more granular permission check in addition to the **allowedRoles**. For example, if you want to allow update access only to members who live in Seattle, you can put "member" in the **allowedRoles** and add an **isWriteAllowed** function that returns true only if city == "Seattle".

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

#### Default Fields and Entities

There are some fields and entities that we add to the config at runtime, both when an SQL query is being constructed using setup.js and when an actual API app is being initialized.

Here are the default fields:

| name | value | type | isEditable |  createReq | foreignEntity | resolvedKeyName
| - | - | - | - | - | - | - 
| id | id of the resource | id | false | 0 | null | null
| ownerid | id of the resource owner | int | false | 0 | user | owner
| createdtime | timestamp of the resource creation | timestamp | false | 0 | null | null

The data types "id" and "timestamp" are special types reserved only for fields "id" and "createdtime". We add the default fields above to every entity specified in the config, except those that are part of the default entities (see below). Default fields cannot be overridden, so if a field with the same name as one of the default fields exists in the config, that field will be ignored.

Here are the default entities:
- **user** - User entity for storing user information. This entity will be used if authentication is enabled.
    - **fields**
    
        | name | value | type | isEditable |  createReq | foreignEntity | resolvedKeyName
        | - | - | - | - | - | - | - 
        | id | user id | id | false | 0 | null | null
        | domain | domain where user info is hosted | string | false | 0 | null | null
        | domainid | user id on its domain | string | false | 0 | null | null
        | roles | user roles (comma separated) | string | false | 0 | null | null
        | username | user name | string | true | 2 | null | null
        | password | user password | secret | true | 2 | null | null
        | email | user email | string | true | 2 | null | null
        | createdtime | timestamp of the resource creation | timestamp | false | 0 | null | null
        
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
        | id | id of the resource | id | false | 0 | null | null
        | ownerid | id of the resource owner | int | false | 0 | user | owner
        | filename | file name of the asset | string | false | 2 | null | null
        
    - **allowedRoles**
    
        | action | roles
        | - | - 
        | read | owner, admin
        | create | member
        | update | 
        | delete | owner, admin

 The existing fields in the default entities above cannot be overriden, but the list itself can be extended. For instance, in the config you can specify additional fields "firstname" and "lastname" for the user entity. The allowedRoles can be overriden, so in the config you can specify your own permission rules for any of the default entities. You can also specify a getReadCondition and an isWriteAllowed functions for a default entity. 


#### Sample Complete Configurations

Here are some sample configurations that utilize the provided features (authentication, storage, granular permission checks). You can find them [here](https://github.com/ctjong/orion/tree/master/config.sample.js).


## API Endpoints

## File Uploads

## Authentication

## Error Logging

## User Roles

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
