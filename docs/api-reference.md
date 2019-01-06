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

## API Reference

- **app** - The underlying [Express application object](https://expressjs.com/en/4x/api.html#app)
- **express** - Object containing Express's static methods (**json()**, **static()**, **Router()**, **urlencoded()**)
- **setupApiEndpoints()** - Setup CRUD endpoints. See [API Endpoints](api-endpoints) for the list of endpoints created from this function call.
- **startAsync(port, callback)** - Start the server. This function is calling Express's **listen()**.
    - **port** - (Optional) Optional port to start the server at.
    - **callback** - (Optional) Callback to execute after the start process is complete.
    **return** - A server application object, returned from Express's **listen()**.
- **findByIdAsync(originalReq, entityName, id)** - Execute a "find by ID" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
    - **originalReq** - (Required) Express Request object.
    - **entityName** - (Required) Target entity name.
    - **id** - (Required) Target record id.
    **return** a promise object containing the response object.
- **findByConditionAsync(originalReq, entityName, orderByField, skip, take, condition)** - Execute a "find by condition" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
    - **originalReq** - (Required) Express Request object.
    - **entityName** - (Required) Target entity name.
    - **orderByField** - (Required) The field to order the results by. You can add "~" in front of the field name to sort in descending order.
    - **skip** - (Required) Number of records to skip. Used for pagination.
    - **take** - (Required) Number of records to take. Used for pagination.
    - **condition** - (Required) Condition string to find the target records. See [Condition Syntax](condition-syntax) for more details on how to write the condition.
    **return** a promise object containing the response object.
- **findAllAsync(originalReq, entityName, orderByField, skip, take)** - Execute a "find all" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
    - **originalReq** - (Required) Express Request object.
    - **entityName** - (Required) Target entity name.
    - **orderByField** - (Required) The field to order the results by. You can add "~" in front of the field name to sort in descending order.
    - **skip** - (Required) Number of records to skip. Used for pagination.
    - **take** - (Required) Number of records to take. Used for pagination.
    **return** a promise object containing the response object.