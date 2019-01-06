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

## Sample blog app

To see what the framework can do, let us try creating a simple API server. Here are the steps to create a simple API server that stores blog post data.

1. Set up a folder for your server application.
2. Install Orion to your application.
    ```bash
    $ npm install --save orion-api
    ```
3. Create a configuration module. This should contain all the settings for your application, and what entities/tables you want to have in the database.
    ```js
    module.exports =
    {
        database:
        {
            dialect: "mssql",
            host: _DATABASE_HOST_,
            name: _DATABASE_NAME_,
            userName: _DATABASE_USERNAME_,
            password: _DATABASE_PASSWORD_
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
                "permissions":
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
    Save the above file as **config.js**. Please see the [Configuration Options](configuration-options) page for more configuration options.
4. Set up **server.js** for the application entry point. Import Orion and the configuration module, and set up the application as follows:
    ```js
    const Orion = require('orion-api');
    const config = require('./config');
    const orionApp = new Orion(config);
    orionApp.setupApiEndpoints();
    
    // You can add more endpoints to the orionApp.app object or do other things here
    
    orionApp.start();
    ```
5. You're all set! You can now run server.js to see your app in action. Unless you specify a port in the start() call, you will see your app running at port 1337.
    ```bash
    $ node server.js
    $
    $ # insert a new blog post entry
    $ curl -d '{"title":"I like trains", "content":"Trains are cool!"}' -H "Content-Type: application/json" -X POST http://localhost:1337/api/data/blogpost
    $
    $ # retrieve all blog post entries
    $ curl http://localhost:1337/api/data/blogpost/public/findall/id/0/100
    ```
    Go to [API Endpoints](api-endpoints) page to see all of the endpoints that we provide.