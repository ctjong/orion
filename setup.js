if (process.argv.length < 4)
{
    console.log("Usage: node setup <config file path> <output file path>");
    return;
}

var fs = require('fs');
var inputPath = process.argv[2];
var outputPath = process.argv[3];

var config = require(inputPath);
fs.writeFile(outputPath, "", function(err)
{
    if (err)
        throw err;
    processConfig(config, outputPath);
});

function processConfig(config, outputPath)
{
    var dropTableStr = "IF exists (select * from sys.objects where name = 'errortable') DROP TABLE errortable;\n";
    var createTableStr = "CREATE TABLE errortable ([id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY, [tag] VARCHAR (10) NOT NULL, [statuscode] INT NOT NULL, [msg] VARCHAR (255) NOT NULL, [url] VARCHAR (255) NOT NULL, [timestamp] BIGINT NOT NULL);\n";
    for(var entityName in config.entities)
    {
        var entity = config.entities[entityName];
        if(!config.entities.hasOwnProperty(entityName))
            continue;
        dropTableStr += "IF exists (select * from sys.objects where name = '" + entityName + "table') DROP TABLE " + entityName + "table;\n";
        createTableStr += "CREATE TABLE " + entityName + "table (\n";
        for(var fieldName in entity.fields)
        {
            var field = entity.fields[fieldName];
            var fieldType = field.type;
            createTableStr += "[" + fieldName + "] ";
            if(fieldType === "id")
            {
                createTableStr += "INT NOT NULL IDENTITY(1,1) PRIMARY KEY,\n";
            }
            else if (fieldType === "string" || fieldType === "secret") 
            {
                createTableStr += "VARCHAR (255) NULL,\n";
            }
            else if (fieldType === "int")
            {
                if(field.foreignKey !== null)
                {
                    createTableStr += "INT NOT NULL,\n";
                }
                else
                {
                    createTableStr += "INT DEFAULT 0,\n";
                }
            }
            else if (fieldType === "timestamp")
            {
                createTableStr += "BIGINT NOT NULL,\n";
            }
            else if (fieldType === "float")
            {
                createTableStr += "FLOAT NULL,\n";
            }
            else if (fieldType === "richtext")
            {
                createTableStr += "TEXT NULL,\n";
            }
            else if (fieldType === "boolean")
            {
                createTableStr += "BIT DEFAULT 0,\n";
            }
        }
        if(!!entity.unique)
        {
            createTableStr += "UNIQUE ([" + entity.unique.join("],[") + "])\n";
        }
        createTableStr += ");\n";
    }
    var str = dropTableStr + createTableStr;
    fs.writeFile(outputPath, str, function(err)
    {
        if(err)
            return console.log(err);
        console.log("Created " + outputPath);
    }); 
}
