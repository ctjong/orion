# Orion Documentation

- [Home](../)
- [Create Your First Orion Application](create-your-first-orion-application)
- [API Endpoints](api-endpoints)
- [Configuration](configuration)
- [Authentication](authentication)
- [User Roles](user-roles)
- [Condition Syntax](condition-syntax)
- [API Reference](api-reference)

## API Endpoints

Here are the REST API endpoints that the library will set up for you.

- **GET /api/data/:entity/:accessType/findbyid/:id**

    Retrieve a record by its ID.

    Headers:
    - **Authorization** - Required only if the access type is private. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

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
    - **Authorization** - Required only if the access type is private. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in.
    - **accessType** - The mode of access:
        - **private** - The requester is the owner of the record. An Authorization header is required.
        - **public** - The requester is not the owner of the record, or not trying to access it as its owner.
    - **orderByField** - The field to order the results by. You can add "~" in front of the field name to sort in descending order.
    - **skip** - Number of records to skip. Used for pagination.
    - **take** - Number of records to take. Used for pagination.
    - **condition** - Condition string to find the target records. See [Condition Syntax](condition-syntax) for more details on how to write the condition.

    Success response:
    - **count** - Number of items found matching the requested details. This value should always be 1 for this endpoint.
    - **items** - An array of items found. Each item will be a JSON object, with 1 level of foreign key resolved.

- **GET /api/data/:entity/:accessType/findall/:orderByField/:skip/:take**

    Retrieve all records in a certain entity.

    Request headers:
    - **Authorization** - Required only if the access type is private. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

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
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

    Request body:
    - **file** - File to upload

    Success response: The inserted asset ID

- **POST /api/data/:entity**

    Add a new record to an entity.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity to put the record in.

    Request body:
    JSON object representation of the new record

    Success response: The inserted ID

- **PUT /api/data/:entity/:id**

    Update a record in an entity.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in
    - **id** - Id of the record to update

    Request body:
    JSON object representation of the new record

    Success response: 200 status code

- **DELETE /api/data/asset/:id**

    Delete an uploaded file from the file storage and from database.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

    Request parameters:
    - **id** - Id of the asset to delete

    Success response: 200 status code

- **DELETE /api/data/:entity/:id**

    Delete a record from an entity.

    Request headers:
    - **Authorization** - Required only if the endpoint is set to be limited to authenticated users. The value of this should be in the format "Bearer {token}". See [Authentication](authentication) section for more details on how to get the access token.

    Request parameters:
    - **entity** - Name of the entity where the record is in
    - **id** - Id of the record to delete

    Success response: 200 status code

- **POST /api/auth/token**

    Get an access token using a set of login credentials. This can be used if all Orion JWT authentication settings are specified in the config. See [Authentication](authentication) section for more details.

    Request body:
    - **username** - Submitted user name 
    - **password** - Submitted password

    Success response:
    - **token** - Access token
    - **id** - User ID
    - **firstname** - User's first name
    - **lastname** - User's last name

- **POST /api/auth/token/fb**

    Get an access token using a temporary Facebook token. See [Authentication](authentication) section for more details.

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