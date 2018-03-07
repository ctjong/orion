# Orion Documentation

- [Home](https://ctjong.github.io/orion)
- [Create Your First Orion Application](https://ctjong.github.io/orion/docs/create-your-first-orion-application)
- [API Endpoints](https://ctjong.github.io/orion/docs/api-endpoints)
- [Configuration](https://ctjong.github.io/orion/docs/configuration)
- [Authentication](https://ctjong.github.io/orion/docs/authentication)
- [User Roles](https://ctjong.github.io/orion/docs/user-roles)
- [Condition Syntax](https://ctjong.github.io/orion/docs/condition-syntax)
- [API Reference](https://ctjong.github.io/orion/docs/api-reference)

## API Reference

An Orion application object is an extension of an [Express application object](https://expressjs.com/en/4x/api.html#app), meaning all default properties and methods  from Express are inherited to the object. All Express's static methods (**json()**, **static()**, **Router()**, **urlencoded()**) are also injected into the application object. In addition to those, here are some more methods that are accessible from the object:

- **Methods**
    - **setupApiEndpoints()** - Setup REST API endpoints to do CRUD operations. See [API Endpoints](#api-endpoints) for the list of endpoints created from this function call.
    - **start(port, callback)** - Start the server. This function is calling Express's **listen()**.
        - **port** - (Optional) Optional port to start the server at.
        - **callback** - (Optional) Callback to execute after the start process is complete.
        - **return** - A server application object, returned from Express's **listen()**.
    - **findById(originalReq, entity, id, callback)** - Execute a "find by ID" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
        - **originalReq** - (Required) Express Request object.
        - **entity** - (Required) Target entity.
        - **id** - (Required) Target record id.
        - **callback** - (Required) Callback fuction. This passes in a response object as parameter, which has the same structure as the return value of the GET endpoint.
    - **findByCondition(originalReq, entity, orderByField, skip, take, condition, callback)** - Execute a "find by condition" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
        - **originalReq** - (Required) Express Request object.
        - **entity** - (Required) Target entity.
        - **orderByField** - (Required) The field to order the results by. You can add "~" in front of the field name to sort in descending order.
        - **skip** - (Required) Number of records to skip. Used for pagination.
        - **take** - (Required) Number of records to take. Used for pagination.
        - **condition** - (Required) Condition string to find the target records. See [Condition Syntax](#condition-syntax) for more details on how to write the condition.
        - **callback** - (Required) Callback fuction. This passes in a response object as parameter, which has the same structure as the return value of the GET endpoint.
    - **findAll(originalReq, entity, orderByField, skip, take, callback)** - Execute a "find all" action. This does the same thing as the GET endpoint but this one can be executed directly from server code.
        - **originalReq** - (Required) Express Request object.
        - **entity** - (Required) Target entity.
        - **orderByField** - (Required) The field to order the results by. You can add "~" in front of the field name to sort in descending order.
        - **skip** - (Required) Number of records to skip. Used for pagination.
        - **take** - (Required) Number of records to take. Used for pagination.
        - **callback** - (Required) Callback fuction. This passes in a response object as parameter, which has the same structure as the return value of the GET endpoint.