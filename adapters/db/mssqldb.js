/**
 * A module for handling interaction with an MSSQL database
 */
module.exports = 
{
    dependencies: ["helper", "condition", "join"],
    Instance: function()
    {
        var _this = this;
        var pool;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct() { }

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        /**
         * Quick find a record based on the given condition
         * @param {any} ctx Request context
         * @param {any} fields Requested fields
         * @param {any} entity Requested entity
         * @param {any} conditionMap Search condition
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function quickFind(ctx, fields, entity, conditionMap, successCb, completeCb)
        {
            var condition = new _this.condition.CompoundCondition("&", []);
            for(var key in conditionMap)
            {
                if(!conditionMap.hasOwnProperty(key)) continue;
                condition.children.push(new _this.condition.Condition(entity, key, "=", conditionMap[key]));
            }
            _this.select(ctx, fields, entity, condition, "id", 0, 1, false, false, function(responseArr)
            {
                successCb(responseArr[0]);
            }, completeCb);
        }

        /**
         * Find records that match the given condition
         * @param {any} ctx Request context
         * @param {any} fields Requested fields
         * @param {any} entity Requested entity
         * @param {any} condition Search condition
         * @param {any} orderByField Field to order the results by
         * @param {any} skip Number of matches to skip
         * @param {any} take Number of matches to take
         * @param {any} resolveFK Whether or not foreign keys should be resolved
         * @param {any} isFullMode Whether or not result should be returned in full mode
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function select(ctx, fields, entity, condition, orderByField, skip, take, resolveFK, isFullMode, successCb, completeCb)
        {
            var joins = resolveFK ? getJoins(ctx, fields, entity) : [];
            var query = new Query();
            var tableName = entity + "table";
            query.append("select ");
            for(var i=0; i<fields.length; i++)
            {
                var fieldName = fields[i];
                if(!isFullMode && fieldName.contains("richtext")) continue;
                query.append((i === 0 ? "": ", ") + "[" + entity + "table].[" + fieldName + "]");
            }
            for(i=0; i<joins.length; i++)
            {
                query.append(", " + getSelectExpression(joins[i]));
            }
            query.append(" from [" + tableName + "]");
            for(i=0; i<joins.length; i++)
            {
                query.append(" " + getJoinExpression(joins[i]));
            }
            query.append(" where ");
            appendWhereClause(query, condition);
            orderByField = decodeURIComponent(orderByField);
            if(orderByField.indexOf("~") === 0)
            {
                query.append(" order by [" + entity + "table].[" + orderByField.substring(1) + "] desc ");
            }
            else
            {
                query.append(" order by [" + entity + "table].[" + orderByField + "] ");
            }
            query.append(" OFFSET (?) ROWS FETCH NEXT (?) ROWS ONLY", skip, take);
            execute(ctx, query, successCb, completeCb);
        }

        /**
         * Find a record that matches the given id
         * @param {any} ctx Request context
         * @param {any} entity Requested entity
         * @param {any} recordId Id of record to find
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function findRecordById(ctx, entity, recordId, successCb, completeCb)
        {
            var fields = _this.helper.getFields(ctx, "read", entity);
            var condition = new _this.condition.Condition(entity, "id", "=", recordId);
            _this.select(ctx, fields, entity, condition, "id", 0, 1, true, false, function(responseArr)
            {
                var record = responseArr[0];
                successCb(_this.helper.fixDataKeysAndTypes(ctx, record, entity));
            }, completeCb);
        }

        /**
         * Count the number of records that match the given condition
         * @param {any} ctx Request context
         * @param {any} fields Requested fields
         * @param {any} entity Requested entity
         * @param {any} condition Condition
         * @param {any} resolveFK Whether or not foreign keys should be resolved
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function count(ctx, fields, entity, condition, resolveFK, successCb, completeCb)
        {
            var joins = resolveFK ? getJoins(ctx, fields, entity) : [];
            var query = new Query();
            var tableName = entity + "table";
            query.append("select count(*) from [" + tableName + "] where ");
            appendWhereClause(query, condition);
            execute(ctx, query, function(dbResponse)
            {
                successCb(dbResponse[0][""]);
            }, completeCb);
        }

        /**
         * Insert a new record
         * @param {any} ctx Request context
         * @param {any} entity Requested entity
         * @param {any} fieldNames New record field names
         * @param {any} fieldValues New record field values
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function insert(ctx, entity, fieldNames, fieldValues, successCb, completeCb)
        {
            var query = new Query();
            var tableName = entity + "table";
            var fieldNamesStr = "[" + fieldNames.join("],[") + "]";
            query.append("insert into [" + tableName + "] (" + fieldNamesStr + ") values (");
            for(var i=0; i<fieldValues.length; i++)
            {
                query.append((i === 0 ? "" : ",") + "?", fieldValues[i]);
            }
            query.append("); select SCOPE_IDENTITY() as [identity];");
            execute(ctx, query, function(dbResponse)
            {
                successCb(dbResponse[0].identity);
            }, completeCb);
        }

        /**
         * Update a record
         * @param {any} ctx Request context
         * @param {any} entity Requested entity
         * @param {any} updateFields Fields to update
         * @param {any} condition Update condition
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function update(ctx, entity, updateFields, condition, successCb, completeCb)
        {
            var query = new Query();
            var isFirstSetClause = true;
            var tableName = entity + "table";
            query.append("update [" + tableName + "] set ");

            for(var fieldName in updateFields)
            {
                if(!updateFields.hasOwnProperty(fieldName)) 
                    continue;
                query.append((isFirstSetClause ? "" : ",") + fieldName + "=?", updateFields[fieldName]);
                isFirstSetClause = false;
            }
            query.append(" where ");
            appendWhereClause(query, condition);
            execute(ctx, query, successCb, completeCb);
        }

        /**
         * Delete a record from the database
         * @param {any} ctx Request context
         * @param {any} entity Requested entity
         * @param {any} id Id of record to delete
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function deleteRecord(ctx, entity, id, successCb, completeCb)
        {
            var query = new Query();
            var tableName = entity + "table";
            var condition = new _this.condition.Condition(entity, "id", "=", id);
            query.append("delete from [" + tableName + "] where ");
            appendWhereClause(query, condition);
            execute(ctx, query, successCb, completeCb);
        }

        /**
         * Set the connection pool to be used by this adapter
         * @param {any} connectionPool connection pool
         */
        function setConnectionPool(connectionPool)
        {
            pool = connectionPool;
        }

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        /**
         * Get Join objects to resolve foreign keys
         * @param {any} ctx Request context
         * @param {any} fields Fields in the requested entity
         * @param {any} entity Requested entity
         * @returns an array of Joins
         */
        function getJoins(ctx, fields, entity)
        {
            var joins = [];
            var ctxFields = ctx.config.entities[entity].fields;
            for(var f=0; f<fields.length; f++)
            {
                var fldName = fields[f];
                var fieldObj = ctxFields[fldName];
                if(!!fieldObj.foreignKey) 
                {
                    joins.push(new _this.join.createForForeignKey(ctx, entity, fldName));
                }
            }
            return joins;
        }

        /**
         * Execute a query
         * @param {any} ctx Request context
         * @param {any} query Query to execute
         * @param {any} successCb Success callback
         * @param {any} completeCb Complete callback
         */
        function execute(ctx, query, successCb, completeCb)
        {
            ensurePoolInitialized(ctx, function()
            {
                var queryString = query.getQueryString();
                var queryParams = query.getQueryParams();
                console.log("-------------------------------------------------");
                console.log("Sending query to database:");
                console.log(queryString);
                console.log("Query parameters:");
                console.log(queryParams);

                var request = new pool.sql.Request(pool);
                for (var key in queryParams)
                {
                    if (!queryParams.hasOwnProperty(key))
                        continue;
                    var paramValue = queryParams[key];
                    if (typeof (paramValue) === "number" && Math.abs(paramValue) > 2147483647)
                    {
                        request.input(key, pool.sql.BigInt, paramValue);
                    }
                    else
                    {
                        request.input(key, paramValue);
                    }
                }
                request.query(queryString, _this.exec.cb(ctx, function(err, dbResponse)
                {
                    if (err)
                    {
                        if (!!completeCb)
                            completeCb();
                        console.log(err);
                        _this.exec.sendErrorResponse(ctx, "a07f", 500, "error while sending query to database");
                    }
                    else
                    {
                        successCb(dbResponse.recordset);
                        if (!!completeCb) 
                            completeCb();
                    }
                }));
                console.log("-------------------------------------------------");
            });
        }

        /**
         * Ensure the connection pool is initialized
         * @param {any} ctx Request context
         * @param {any} callback Callback function
         */
        function ensurePoolInitialized(ctx, callback)
        {
            if(!!pool)
            {
                callback();
                return;
            }
            var sql = require("mssql");
            pool = new sql.ConnectionPool(ctx.config.database.connectionString, _this.exec.cb(ctx, function(err)
            {
                if (err)
                {
                    console.log(err);
                    _this.exec.sendErrorResponse(ctx, "f8cb", 500, "error while connecting to database");
                    return;
                }
                pool.sql = sql;
                callback();
            }));
        }

        /**
         * A class representing an MSSQL query object
         */
        function Query()
        {
            var _this = this;
            var paramsCounter = 0;
            var queryString = "";
            var queryParams = {};

            /**
             * Append the given string and params to the query
             */
            function append()
            {
                var str = arguments[0];
                if (!str)
                    return;
                if (arguments.length > 1)
                {
                    var newStr = "";
                    var currentArgIndex = 1;
                    for (var i = 0; i < str.length; i++)
                    {
                        if (str[i] !== "?")
                        {
                            newStr += str[i];
                            continue;
                        }
                        newStr += "@value" + paramsCounter + " ";
                        queryParams["value" + paramsCounter] = arguments[currentArgIndex];
                        paramsCounter++;
                        currentArgIndex++;
                    }
                    str = newStr;
                }
                queryString += str;
            }

            /**
             * Get the query string
             */
            // Get the query string
            function getQueryString()
            {
                return queryString;
            }

            /**
             * Get the query parameters
             */
            function getQueryParams()
            {
                return queryParams;
            }

            this.append = append;
            this.getQueryString = getQueryString;
            this.getQueryParams = getQueryParams;
        }

        /**
         * Get a join expression for the given Join object
         * @param {any} joinObj Join object
         * @returns a JOIN clause string
         */
        function getJoinExpression(joinObj)
        {
            return "INNER JOIN [" + joinObj.e2 + "table] [" + joinObj.e2Alias + "] ON [" + joinObj.e1 + "table].[" + joinObj.e1JoinField + "] = [" + joinObj.e2Alias + "].[" + joinObj.e2JoinField + "]";
        }

        /**
         * Get a select expression for the given Join object
         * @param {any} joinObj Join object
         * @returns a SELECT clause string
         */
        function getSelectExpression(joinObj)
        {
            var str = "";
            for (var i = 0; i < joinObj.e2SelectFields.length; i++)
            {
                str += (str === "" ? "" : ", ") + "[" + joinObj.e2Alias + "].[" + joinObj.e2SelectFields[i] + "] AS [" + joinObj.e2Alias + "_" + joinObj.e2SelectFields[i] + "]";
            }
            return str;
        }

        /**
         * Append where clause to the given query based on the specified condition
         * @param {any} query Query object
         * @param {any} condObj Condition object
         */
        function appendWhereClause(query, condObj)
        {
            if (!condObj.children)
            {
                if (condObj.fieldName === "1" && condObj.fieldValue === "1")
                {
                    query.append("1=1");
                }
                else if (condObj.operator === "~")
                {
                    query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] like ?", "%" + condObj.fieldValue + "%");
                }
                else if (typeof (condObj.fieldValue) === "string" && condObj.fieldValue.toLowerCase() === "null")
                {
                    if (condObj.operator == "=")
                    {
                        query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is null");
                    }
                    else
                    {
                        query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "] is not null");
                    }
                }
                else
                {
                    query.append("[" + condObj.entity + "table].[" + condObj.fieldName + "]" + condObj.operator + "?", condObj.fieldValue);
                }
            }
            else if(condObj.children.length > 0)
            {
                query.append("(");
                for (var i = 0; i < condObj.children.length; i++)
                {
                    var childCond = condObj.children[i];
                    if (i > 0) query.append(condObj.operator === "&" ? " AND " : " OR ");
                    appendWhereClause(query, childCond);
                }
                query.append(")");
            }
            else
            {
                query.append("1=1");
            }
        }

        this.quickFind = quickFind;
        this.select = select;
        this.findRecordById = findRecordById;
        this.count = count;
        this.insert = insert;
        this.update = update;
        this.deleteRecord = deleteRecord;
        this.setConnectionPool = setConnectionPool;
        _construct();
    }
};