# Orion Documentation

- [Home](../)
- [Create Your First Orion Application](create-your-first-orion-application)
- [API Endpoints](api-endpoints)
- [Configuration Options](configuration-options)
- [Sample Configuration](sample-configuration)
- [Authentication](authentication)
- [User Roles](user-roles)
- [Condition Syntax](condition-syntax)
- [API Reference](api-reference)

## Configuration Options

A configuration module is required to give the application the necessary information about your project. This module should specify the connection strings, authentication and authorization settings, user roles and access levels, and most importantly, the data models.

Below is the list of settings to be included in a configuration module:
- **database** - (Required) Database configuration
    - **dialect** - (Required) Database dialect to use (mssql/mysql).
    - **host** - (Required) Database host.
    - **name** - (Required) Database name.
    - **userName** - (Required) Username to connect to the database.
    - **password** - (Required) Password to connect to the database.
- **auth** - (Optional) Authentication configuration. Required if you want to enable authentication.
    - **secretKey** - (Required) Secret key for token encryption.
    - **salt** - (Optional) Salt string for password encryption. Required if you want to support Orion JWT authentication.
    - **tokenLifetimeInMins** - (Optional) Token lifetime in minutes. If not provided, the token will be set to never expire.
    - **passwordReqs** - (Optional) New password requirements. Required if you want to support Orion JWT authentication.
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
- **entities** - (Required) An object that contains a list of data entities (tables). Each entry in the object should be a mappings from an entity name to an [entity configuration](entity-configuration) object. The entity name should contain no space, and preferably be all lowercase to make it consistent with the names in the database system.

### Entity Configuration

Here are the properties that must/may be included in an entity configuration object:
- **fields** - (Required) An object that contains a list of fields in the entity. Each entry in the object should be a mapping from a field name to a [field configuration](field-configuration) object. Similar to entity name, the field name should also contain no space, and preferably be all lowercase to make it consistent with the names in the database system.
- **allowedRoles** - (Required) An object that specify which user roles are allowed to do a certain operation. Each entry in the object should be a mapping from an operation name (create/read/update/delete) to an array of user roles. See [User Roles](user-roles) for more info on what the user roles can be.
- **unique** - (Optional) An array that specifies which fields should be unique.
- **getReadCondition** - (Optional) A function to be invoked at the beginning of each read (GET) operation. This function passes in as parameters the user roles and user ID, and should return a condition string to be added to the database read query. This is useful if you need a more granular permission rule in addition to the **allowedRoles** list above. For examnple, if you want to allow read access only to members who are more than 20 years old, you can put the role "member" in the **allowedRoles** and add a **getReadCondition** function that returns condition "age>20". See [Condition Syntax](condition-syntax) for more details on how to write the condition.
- **isWriteAllowed** - (Optional) A function to be invoked at the beginning of each write (POST/PUT/DELETE) request. This function passes in as parameters the action name, user roles, user ID, record object from DB, and record object from user, and it should return a boolean, whether or not to allow the request. This is useful if you need a more granular permission check in addition to the **allowedRoles**. For example, if you want to allow update access only to members who live in Seattle, you can put "member" in the **allowedRoles** and add an **isWriteAllowed** function that returns true only if city == "Seattle".

### Field Configuration

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
    - **targetEntityName** - (Required) the entity name that the field is linked to. The value of the field will be matched with the "id" field of the target entity.
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
    - **isManyToMany** - (Required) Defines whether or not this entity is in many-to-many relationship with the target entity.

### Default Fields and Entities

[Here](https://github.com/ctjong/orion/blob/master/src/defaultConfig.ts) is a list of default fields and entities that are being automatically added to your configuration at runtime.

The data types "id" and "timestamp" are special types reserved only for fields "id" and "createdtime". The fields specified in **defaultFields** are added to every entity in your config.

All values in the **defaultEntities** and **defaultFields** are overridable in your config. If an override is specified, the config values will be merged using Object.assign();