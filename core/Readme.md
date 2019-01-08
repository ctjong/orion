# Orion API

[![npm](https://img.shields.io/npm/dt/orion-api.svg)](https://www.npmjs.com/package/orion-api) [![npm](https://img.shields.io/npm/v/orion-api.svg)](https://www.npmjs.com/package/orion-api) [![David](https://img.shields.io/david/ctjong/orion.svg)](https://www.npmjs.com/package/orion-api)

Orion is a framework for creating a config-based REST API server, meaning the client can create a full-fledged API server by only defining a single configuration file. The framework is built on top of [Express](https://github.com/expressjs/express). The server application that the framework creates will support CRUD, file upload, authentication, and error handling.

## Supported components

The framework allows you to use the following services based on your preferences:
- Database: **SQL Server** / **MySQL** / **sqlite**
- File storage: **Azure Blob Storage** / **Amazon S3** / **Local Server**
- Authentication: **Facebook token** / **Orion JSON Web Token (JWT)**
- Monitoring: **Azure Application Insights**

## Installation

```bash
$ npm install --save orion-api
```

## Example usage

**config.js**

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
                "title": { type: "string", isEditable: true, isRequired: true, foreignKey: null },
                "content": { type: "richtext", isEditable: true, isRequired: true, foreignKey: null }
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
};
```

**server.js**

```js
const Orion = require('orion-api');
const config = require('./config');
const orionApp = new Orion(config);
orionApp.setupApiEndpoints();

// to add more endpoints, use orionApp.app like regular Express app:
// orionApp.app.get("/additionalroute", (req, res) => ...);

orionApp.startAsync();
```

## Documentation

- [Home](https://ctjong.github.io/orion)
- [Sample Blog App](https://ctjong.github.io/orion/docs/sample-blog-app)
- [API Endpoints](https://ctjong.github.io/orion/docs/api-endpoints)
- [Configuration Options](https://ctjong.github.io/orion/docs/configuration-options)
- [Sample Configuration](https://ctjong.github.io/orion/docs/sample-configuration)
- [Authentication](https://ctjong.github.io/orion/docs/authentication)
- [User Roles](https://ctjong.github.io/orion/docs/user-roles)
- [Condition Syntax](https://ctjong.github.io/orion/docs/condition-syntax)
- [API Reference](https://ctjong.github.io/orion/docs/api-reference)


## Links

[Contributing](https://github.com/ctjong/orion/tree/master/CONTRIBUTING.md)

[License](https://github.com/ctjong/orion/tree/master/LICENSE)