# Orion API

[![npm](https://img.shields.io/npm/dt/orion-api.svg)](https://www.npmjs.com/package/orion-api) [![npm](https://img.shields.io/npm/v/orion-api.svg)](https://www.npmjs.com/package/orion-api) [![David](https://img.shields.io/david/ctjong/orion.svg)](https://www.npmjs.com/package/orion-api)

Orion is a wrapper framework of [Express](https://github.com/expressjs/express) that allows you to build a config-based API server. It reads a configuration file that you provide and based on that it will set up a full-fledged API server, which includes CRUD data endpoints, file management endpoints, authentication endpoints, and error handling endpoints.

## Supported components

The framework allows you to use the following services based on your preferences:
- Database: **SQL Server** / **MySQL**
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
};
```

**server.js**

```js
const orion = require('orion-api');
const config = require('./config');
const orionApp = new orion.Orion(config);
orionApp.setupApiEndpoints();
orionApp.start();
```

## Documentation

- [Home](https://ctjong.github.io/orion)
- [Create Your First Orion Application](https://ctjong.github.io/orion/docs/create-your-first-orion-application)
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