# Orion Documentation

- [Home](../)
- [Create Your First Orion Application](create-your-first-orion-application)
- [API Endpoints](api-endpoints)
- [Configuration](configuration)
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
    Please see the [configuration](configuration) section for more configuration options.
4. Set up database tables based on the configuration you created using our setup script. The script is located at the root of the Orion module folder. It takes the configuration file path and the output file path as arguments. Note that the input and output paths have to be absolute paths.
    ```bash
    $ node node_modules/orion-api/setup.js ~/appPath/config.js ~/appPath/setup.sql
    ```
    The above command will create an SQL query file named setup.sql that you can run on the database server to set up the tables.
5. Set up **server.js** for the application entry point. Import Orion and the configuration module, and set up the application as follows:
    ```js
    var orion = require('orion-api');
    var config = require('./config');
    var app = new orion(config);
    app.setupApiEndpoints();
    
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
    Go to [API Endpoints](api-endpoints) section to see all of the endpoints that we provide.