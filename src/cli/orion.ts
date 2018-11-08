#!/usr/bin/env node

import * as fs from 'fs';
import { IConfig, IEntity } from '../core/types';

let engine:string;
let  outputPath:string;

/**
 * Entry point of the script.
 */
const main = () =>
{
    // process arguments
    if (process.argv.length < 3)
    {
        console.log("Usage: orion <command>");
        console.log("Available commands: setup");
        return;
    }
    const cmd = process.argv[2];
    if(cmd !== "setup")
    {
        console.log("Unrecognized command: " + cmd);
        return;
    }
    if(process.argv.length < 5)
    {
        console.log("Usage: orion setup <config file path> <output file path>");
        return;
    }

    const inputPath = process.argv[3];
    outputPath = process.argv[4];

    // get config
    const contextFactory = new (require('./contextFactory'))();
    const inputConfig = require(process.cwd() + "/" + inputPath);
    contextFactory.initializeConfig(inputConfig);
    const config = contextFactory.getConfig();
    engine = config.database.engine;

    // write the SQL file
    fs.writeFile(outputPath, "", (err) =>
    {
        if (err)
            throw err;
        processConfig(config);
    });
}

/**
 * Process the given config module and try to output an SQL file to setup the database.
 * @param config Config module
 */
const processConfig = (config:IConfig) =>
{
    let dropTableStr = drop("errortable");
    let pkAttr = engine === "mssql" ? "IDENTITY(1,1) PRIMARY KEY" : "AUTO_INCREMENT PRIMARY KEY";
    let createTableStr = "CREATE TABLE errortable (" + nm("id") + " INT NOT NULL " + pkAttr + ", " + 
        nm("tag") + " VARCHAR (10) NOT NULL, " + nm("statuscode") + " INT NOT NULL, " + nm("msg") + " VARCHAR (255) NOT NULL," +
        nm("url") + " VARCHAR (255) NOT NULL, " + nm("timestamp") + " BIGINT NOT NULL);\n";
    for(const entityName in config.entities)
    {
        const entity:IEntity = config.entities[entityName];
        if(!config.entities.hasOwnProperty(entityName))
            continue;
        dropTableStr += drop(entityName + "table");
        createTableStr += "CREATE TABLE " + entityName + "table (\n";
        let fieldsStr = "";
        for(const fieldName in entity.fields)
        {
            if(fieldsStr !== "")
                fieldsStr += ",\n";
            const field = entity.fields[fieldName];
            const fieldType = field.type;
            fieldsStr += nm(fieldName) + " ";
            if(fieldType === "id")
                fieldsStr += "INT NOT NULL " + pkAttr;
            else if (fieldType === "string" || fieldType === "secret") 
            {
                fieldsStr += "VARCHAR (255) NULL";
            }
            else if (fieldType === "int")
            {
                if(field.foreignKey !== null)
                    fieldsStr += "INT NOT NULL";
                else
                    fieldsStr += "INT DEFAULT 0";
            }
            else if (fieldType === "timestamp")
            {
                fieldsStr += "BIGINT NOT NULL";
            }
            else if (fieldType === "float")
            {
                fieldsStr += "FLOAT NULL";
            }
            else if (fieldType === "richtext")
            {
                fieldsStr += "TEXT NULL";
            }
            else if (fieldType === "boolean")
            {
                if(engine === "mssql")
                    fieldsStr += "BIT DEFAULT 0";
                else
                    fieldsStr += "TINYINT(1) DEFAULT 0";
            }
        }
        createTableStr += fieldsStr;
        if(!entity.unique)
        {
            createTableStr += "\n);\n";
        }
        else
        {
            let uniqueStr = "";
            for(let i=0; i<entity.unique.length; i++)
                uniqueStr += (uniqueStr === "" ? "" : ",") + nm(entity.unique[i]);
            createTableStr += ",\nUNIQUE (" + uniqueStr + ")\n);\n";
        }
    }
    const str = dropTableStr + createTableStr;
    fs.writeFile(outputPath, str, (err) =>
    {
        if(err)
            return console.log(err);
        console.log("Created " + outputPath);
    }); 
}

/**
 * Create a drop table query
 * @param tableName table name 
 * @returns drop table query
 */
const drop = (tableName:string) =>
{
    if(engine === "mssql")
        return "IF exists (select * from sys.objects where name = '" + tableName + "') DROP TABLE " + tableName + ";\n";
    else
        return "DROP TABLE IF EXISTS " + tableName + ";\n";
}

/**
 * Format the given name to be included in a query
 * @param nm table/column name
 * @returns formatted name
 */
const nm = (name:string) =>
{
    const ob = engine === "mssql" ? "[" : "`";
    const cb = engine === "mssql" ? "]" : "`";
    return ob + name + cb;
}

main();