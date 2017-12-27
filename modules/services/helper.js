module.exports = 
{
    dependencies: [],
    Instance: function()
    {
        var _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        this.getFields = function(ctx, action, entity)
        {
            if(!entity) entity = ctx.entity;
            var fields = ctx.config.entities[entity].fields;
            var allowedFields = [];
            for(var fieldName in fields)
            {
                if(!fields.hasOwnProperty(fieldName))
                    continue;
                if(!(action === "read" && fields[fieldName].type === "secret") &&
                    !(action === "update" && !fields[fieldName].isEditable))
                {
                    allowedFields.push(fieldName);
                }
            }
            return allowedFields;
        };

        this.fixDataKeysAndTypes = function(ctx, data, entity)
        {
            if(!data)
                return data;
            var newData = {};
            for(var key in data)
            {
                if(!data.hasOwnProperty(key))
                    continue;
                if(key.contains("_"))
                {
                    var keyParts = key.split("_");
                    var outerKey = keyParts[0].toLowerCase();
                    var innerKey = keyParts[1].toLowerCase();
                    if(!newData[outerKey]) newData[outerKey] = {};
                    newData[outerKey][innerKey] = data[key];
                }
                else
                {
                    newData[key.toLowerCase()] = data[key];
                }
            }
            if(!entity) 
                entity = ctx.entity;
            fixDataTypes(ctx, entity, newData);
            for(var newKey in newData)
            {
                if(!newData.hasOwnProperty(newKey) || !newData[newKey] || typeof(newData[newKey]) !== "object")
                    continue;
                fixDataTypes(ctx, entity, newData[newKey]);
            }
            return newData;
        };

        this.validate = function(ctx, action, queryMdl, resourceId, requestBody, callback)
        {
            requestBody = _this.fixDataKeysAndTypes(ctx, requestBody);
            if(action === "create")
            {
                resolveForeignKeys(ctx, requestBody, queryMdl, function(requestBody)
                {
                    getAndRunValidator(ctx, action, null, requestBody, queryMdl, callback);
                });
            }
            else
            {
                queryMdl.findResourceById(ctx, ctx.entity, resourceId, function(resource)
                {
                    if(!resource)
                        throw new _this.error.Error("7e13", 400, "resource not found with id " + resourceId);
                    resource = _this.fixDataKeysAndTypes(ctx, resource);
                    if((ctx.entity === "user" && ctx.userId === resource.id) || 
                        (ctx.entity !== "user" && ctx.userId === resource.ownerid))
                    {
                        ctx.userRoles.push("owner");
                    }
                    getAndRunValidator(ctx, action, resource, requestBody, queryMdl, callback);
                });
            }
        };

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        function fixDataTypes(ctx, entity, dataObj)
        {
            var fields = ctx.config.entities[entity].fields;
            for(var fieldName in fields)
            {
                if(!fields.hasOwnProperty(fieldName))
                    continue;
                var fieldType = fields[fieldName].type;
                if(dataObj[fieldName] === null || typeof(dataObj[fieldName]) === "undefined")
                    continue;
                if(fieldType === "int")
                {
                    dataObj[fieldName] = parseInt(dataObj[fieldName]);
                }
                else if(fieldType === "float")
                {
                    dataObj[fieldName] = parseFloat(dataObj[fieldName]);
                }
            }
        }

        function getAndRunValidator(ctx, action, oldData, newData, queryMdl, callback)
        {
            var validator = getValidator(ctx, action);
            if(typeof validator === "undefined" || validator === null)
                throw new _this.error.Error("5753", 401, "Unauthorized");
            runValidator(validator, ctx.userId, oldData, newData, callback);
        }

        function getValidator(ctx, action, entity)
        {
            if(!entity)
                entity = ctx.entity;
            var validators = ctx.config.entities[entity].validators[action];
            if(!validators)
                return null;
            var validator = null;
            for(var i=0; i<validators.length; i++)
            {
                if(ctx.userRoles.containsAny(validators[i].roles))
                {
                    validator = validators[i];
                }
            }
            return validator;
        }

        function runValidator(validator, userId, oldData, newData, callback)
        {
            var result = null;
            if(!!oldData && !newData)
            {
                result = validator.fn(oldData);
            }
            else if(!oldData && !!newData)
            {
                result = validator.fn(newData);
            }
            else if(!!oldData && !!newData)
            {
                result = validator.fn(userId, oldData, newData);
            }
            else
            {
                throw new _this.error.Error("29c8", 400, "bad request. missing data");
            }
            if(!result)
            {
                throw new _this.error.Error("c75f", 400, "bad request. failed validator.");
            }
            callback(oldData, newData);
        }

        function resolveForeignKeys(ctx, requestBody, queryMdl, callback)
        {
            var op = { active: 0 };
            var fields = ctx.config.entities[ctx.entity].fields;
            for(var fieldName in fields)
            {
                if(!fields.hasOwnProperty(fieldName) || !fields[fieldName].foreignKey)
                    continue;
                resolveForeignKey(ctx, op, requestBody, fieldName, fields[fieldName].foreignKey, queryMdl, callback);
            }
            if(op.active <= 0)
                callback(requestBody);
        }

        function resolveForeignKey(ctx, op, requestBody, fieldName, fk, queryMdl, callback)
        {
            queryMdl.findResourceById(ctx, fk.foreignEntity, requestBody[fieldName], function(resource)
            {
                op.active--;
                requestBody[fk.resolvedKeyName] = _this.fixDataKeysAndTypes(ctx, resource);
                if(op.active <= 0)
                    callback(requestBody);
            });
            op.active++;
        }

        _construct();
    }
};