#!/usr/bin/env node

(function ()
{
    var engine;
    var outputPath;
    var fs = require('fs');

    /**
     * Entry point of the script.
     */
    function main()
    {
        // process arguments
        if (process.argv.length < 3)
        {
            console.log("Usage: orion <command>");
            console.log("Available commands: setup");
            return;
        }
        var cmd = process.argv[2];
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

        var inputPath = process.argv[3];
        outputPath = process.argv[4];

        // get config
        var contextFactory = new (require('./contextFactory'))();
        var inputConfig = require(process.cwd() + "/" + inputPath);
        contextFactory.initializeConfig(inputConfig);
        var config = contextFactory.getConfig();
        engine = config.database.engine;

        // write the SQL file
        fs.writeFile(outputPath, "", function(err)
        {
            if (err)
                throw err;
            processConfig(config, outputPath);
        });
    }

    /**
     * Process the given config module and try to output an SQL file to setup the database.
     * @param {any} config Config module
     */
    function processConfig(config)
    {
        var dropTableStr = drop("errortable");
        var pkAttr = engine === "mssql" ? "IDENTITY(1,1) PRIMARY KEY" : "AUTO_INCREMENT PRIMARY KEY";
        var createTableStr = "CREATE TABLE errortable (" + nm("id") + " INT NOT NULL " + pkAttr + ", " + 
            nm("tag") + " VARCHAR (10) NOT NULL, " + nm("statuscode") + " INT NOT NULL, " + nm("msg") + " VARCHAR (255) NOT NULL," +
            nm("url") + " VARCHAR (255) NOT NULL, " + nm("timestamp") + " BIGINT NOT NULL);\n";
        for(var entityName in config.entities)
        {
            var entity = config.entities[entityName];
            if(!config.entities.hasOwnProperty(entityName))
                continue;
            dropTableStr += drop(entityName + "table");
            createTableStr += "CREATE TABLE " + entityName + "table (\n";
            var fieldsStr = "";
            for(var fieldName in entity.fields)
            {
                if(fieldsStr !== "")
                    fieldsStr += ",\n";
                var field = entity.fields[fieldName];
                var fieldType = field.type;
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
                var uniqueStr = "";
                for(var i=0; i<entity.unique.length; i++)
                    uniqueStr += (uniqueStr === "" ? "" : ",") + nm(entity.unique[i]);
                createTableStr += ",\nUNIQUE (" + uniqueStr + ")\n);\n";
            }
        }
        var str = dropTableStr + createTableStr;
        fs.writeFile(outputPath, str, function(err)
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
    function drop(tableName)
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
    function nm(name)
    {
        var ob = engine === "mssql" ? "[" : "`";
        var cb = engine === "mssql" ? "]" : "`";
        return ob + name + cb;
    }

    main();
})();