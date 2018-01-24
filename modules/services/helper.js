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
         * This will check if an action is permitted, given the context and target record.
         * Also resolve any foreign key that exists in the request body.
         * Throws an exception on failure.
         * @param {any} ctx Request context
         * @param {any} action Action name
         * @param {any} db Database module
         * @param {any} recordId Record ID
         * @param {any} requestBody Requset body
         * @param {any} callback Callback function
         */
        function onBeginWriteRequest (ctx, action, db, recordId, requestBody, callback)
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
                db.findRecordById(ctx, ctx.entity, recordId, function(record)
                {
                    if(!record)
                        throw new _this.error.Error("7e13", 400, "record not found with id " + recordId);
                    record = _this.fixDataKeysAndTypes(ctx, record);
                    if((ctx.entity === "user" && ctx.userId === record.id) || (ctx.entity !== "user" && ctx.userId === record.ownerid))
                    {
                        ctx.userRoles.push("owner");
                    }
                    validateRoles(ctx, action);
                    if (!!isWriteAllowedFn && !isWriteAllowedFn(action, ctx.userRoles, ctx.userId, record, requestBody))
                        throw new _this.error.Error("29c8", 400, "bad " + action + " request. operation not allowed.");
                    callback(record, requestBody);
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
            db.findRecordById(ctx, fk.foreignEntity, requestBody[fieldName], function(record)
            {
                op.active--;
                requestBody[fk.resolvedKeyName] = _this.fixDataKeysAndTypes(ctx, record);
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