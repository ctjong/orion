/**
 * A module containing utility/helper functions
 */
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

        /**
         * Get a list of fields that are accessible from the given entity for the
         * specified action.
         * @param {any} ctx Request context
         * @param {any} action Action name
         * @param {any} entity Entity name
         * @returns an array of field names
         */
        function getFields (ctx, action, entity)
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

        /**
         * Fix the key name and type of each item in the given data object
         * @param {any} ctx Request context
         * @param {any} data Data object
         * @param {any} entity Entity name
         * @returns fixed data object
         */
        function fixDataKeysAndTypes (ctx, data, entity)
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

        /**
         * To be invoked at the beginning of a write request (create/update/delete).
         * This will check if an action is permitted, given the context and target resource.
         * Also resolve any foreign key that exists in the request body.
         * Throws an exception on failure.
         * @param {any} ctx Request context
         * @param {any} action Action name
         * @param {any} db Database module
         * @param {any} resourceId Resource ID
         * @param {any} requestBody Requset body
         * @param {any} callback Callback function
         */
        function onBeginWriteRequest (ctx, action, db, resourceId, requestBody, callback)
        {
            requestBody = _this.fixDataKeysAndTypes(ctx, requestBody);
            var isWriteAllowedFn = ctx.config.entities[ctx.entity].isWriteAllowed;
            if(action === "create")
            {
                validateRoles(ctx, "create");
                resolveForeignKeys(ctx, requestBody, db, function (requestBody)
                {
                    if (!!isWriteAllowedFn && !isWriteAllowedFn(action, ctx.userRoles, ctx.userId, null, requestBody))
                        throw new _this.error.Error("c75f", 400, "bad create request. operation not allowed.");
                    callback(null, requestBody);
                });
            }
            else
            {
                db.findResourceById(ctx, ctx.entity, resourceId, function(resource)
                {
                    if(!resource)
                        throw new _this.error.Error("7e13", 400, "resource not found with id " + resourceId);
                    resource = _this.fixDataKeysAndTypes(ctx, resource);
                    if((ctx.entity === "user" && ctx.userId === resource.id) || (ctx.entity !== "user" && ctx.userId === resource.ownerid))
                    {
                        ctx.userRoles.push("owner");
                    }
                    validateRoles(ctx, action);
                    if (!!isWriteAllowedFn && !isWriteAllowedFn(action, ctx.userRoles, ctx.userId, resource, requestBody))
                        throw new _this.error.Error("29c8", 400, "bad " + action + " request. operation not allowed.");
                    callback(resource, requestBody);
                });
            }
        };

        /**
         * Check if the given action is permitted, given the current user roles context.
         * Throws an exception on failure.
         * @param {any} ctx Request context
         * @param {any} action Action name
         */
        function validateRoles(ctx, action)
        {
            if (!ctx.config.entities[ctx.entity].allowedRoles[action].containsAny(ctx.userRoles))
                throw new _this.error.Error("a058", 401, "Unauthorized");
        }

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        /**
         * Fix the type of each item in the given data object
         * @param {any} ctx Request context
         * @param {any} entity Entity name
         * @param {any} dataObj Data object
         * @returns fixed data object
         */
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

        /**
         * Get and run the validator for a given action.
         * Throws an exception on failure.
         * @param {any} ctx Request context
         * @param {any} action Action name
         * @param {any} oldData Old resource data
         * @param {any} newData New resource data
         * @param {any} db Database module
         * @param {any} callback Callback function
         */
        function getAndRunValidator(ctx, action, oldData, newData, db, callback)
        {
            var validator = getValidator(ctx, action);
            if(typeof validator === "undefined" || validator === null)
                throw new _this.error.Error("5753", 401, "Unauthorized");
            runValidator(validator, ctx.userId, oldData, newData, callback);
        }

        /**
         * Get the validator function for the given action
         * @param {any} ctx Request context
         * @param {any} action Action name
         * @param {any} entity Entity name
         */
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

        /**
         * Run the validator function for the given action.
         * Throws an exception on failure.
         * @param {any} validator Validator function
         * @param {any} userId User ID
         * @param {any} entity Entity name
         * @param {any} oldData Old resource data
         * @param {any} newData New resource data
         * @param {any} callback Callback function
         */
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

        /**
         * Resolve the foreign keys in the given request body
         * @param {any} ctx Request context
         * @param {any} requestBody Request body
         * @param {any} db Database module
         * @param {any} callback Callback function
         */
        function resolveForeignKeys(ctx, requestBody, db, callback)
        {
            var op = { active: 0 };
            var fields = ctx.config.entities[ctx.entity].fields;
            for(var fieldName in fields)
            {
                if(!fields.hasOwnProperty(fieldName) || !fields[fieldName].foreignKey)
                    continue;
                resolveForeignKey(ctx, op, requestBody, fieldName, fields[fieldName].foreignKey, db, callback);
            }
            if(op.active <= 0)
                callback(requestBody);
        }

        /**
         * Resolve a foreign key field in the given request body
         * @param {any} ctx Request context
         * @param {any} op Foreign key resolve operation object
         * @param {any} requestBody Request body
         * @param {any} fieldName Field name
         * @param {any} fk Foreign key object
         * @param {any} db Database module
         * @param {any} callback Callback function
         */
        function resolveForeignKey(ctx, op, requestBody, fieldName, fk, db, callback)
        {
            db.findResourceById(ctx, fk.foreignEntity, requestBody[fieldName], function(resource)
            {
                op.active--;
                requestBody[fk.resolvedKeyName] = _this.fixDataKeysAndTypes(ctx, resource);
                if(op.active <= 0)
                    callback(requestBody);
            });
            op.active++;
        }

        this.getFields = getFields;
        this.fixDataKeysAndTypes = fixDataKeysAndTypes;
        this.onBeginWriteRequest = onBeginWriteRequest;
        this.validateRoles = validateRoles;
        _construct();
    }
};