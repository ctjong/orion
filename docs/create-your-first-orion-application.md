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
    Save the above file as **config.js**. Please see the [Configuration Options](configuration-options) page for more configuration options.
5. Set up **server.js** for the application entry point. Import Orion and the configuration module, and set up the application as follows:
    ```js
    const orion = require('orion-api');
    const config = require('./config');
    const orionApp = new orion.Orion(config);
    orionApp.setupApiEndpoints();
    
    // You can add more endpoints to the orionApp.app object or do other things here
    
    orionApp.start();
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
    Go to [API Endpoints](api-endpoints) page to see all of the endpoints that we provide.