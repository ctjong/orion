module.exports = 
{
    dependencies: ["helper", "condition", "join", "query"],
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

        this.quickFind = function(ctx, fields, entity, conditionMap, successCb, completeCb)
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
        };

        this.select = function (ctx, fields, entity, condition, orderByField, skip, take, resolveFK, isFullMode, successCb, completeCb)
        {
            var joins = resolveFK ? getJoins(ctx, fields, entity) : [];
            var queryObj = new _this.query.Query();
            var tableName = entity + "table";
            queryObj.queryString = "select ";
            for(var i=0; i<fields.length; i++)
            {
                var fieldName = fields[i];
                if(!isFullMode && fieldName.contains("richtext")) continue;
                queryObj.queryString += (i === 0 ? "": ", ") + "[" + entity + "table].[" + fieldName + "]";
            }
            for(i=0; i<joins.length; i++)
            {
                queryObj.queryString += ", " + joins[i].getSelectExpression();
            }
            queryObj.queryString += " from [" + tableName + "]";
            for(i=0; i<joins.length; i++)
            {
                queryObj.queryString += " " + joins[i].getJoinExpression();
            }
            queryObj.queryString += " where " + condition.getWhereExpression(queryObj);
            orderByField = decodeURIComponent(orderByField);
            if(orderByField.indexOf("~") === 0)
            {
                queryObj.queryString += " order by [" + entity + "table].[" + orderByField.substring(1) + "] desc ";
            }
            else
            {
                queryObj.queryString += " order by [" + entity + "table].[" + orderByField + "] ";
            }
            queryObj.queryString += " OFFSET (" + queryObj.addQueryParam(skip) + ") ROWS FETCH NEXT (" + queryObj.addQueryParam(take) + ") ROWS ONLY";
            queryObj.execute(ctx, successCb, completeCb);
        };

        this.findResourceById = function(ctx, entity, resourceId, successCb, completeCb)
        {
            var fields = _this.helper.getFields(ctx, "read", entity);
            var condition = new _this.condition.Condition(entity, "id", "=", resourceId);
            _this.select(ctx, fields, entity, condition, "id", 0, 1, true, false, function(responseArr)
            {
                var resource = responseArr[0];
                successCb(_this.helper.fixDataKeysAndTypes(ctx, resource, entity));
            }, completeCb);
        };

        this.count = function(ctx, fields, entity, condition, resolveFK, successCb, completeCb)
        {
            var joins = resolveFK ? getJoins(ctx, fields, entity) : [];
            var queryObj = new _this.query.Query();
            var tableName = entity + "table";
            queryObj.queryString = "select count(*) from [" + tableName + "] where " + condition.getWhereExpression(queryObj);
            queryObj.execute(ctx, successCb, completeCb);
        };

        this.insert = function(ctx, entity, fieldNames, fieldValues, successCb, completeCb)
        {
            var queryObj = new _this.query.Query();
            var tableName = entity + "table";
            var fieldNamesStr = "[" + fieldNames.join("],[") + "]";
            queryObj.queryString = "insert into [" + tableName + "] (" + fieldNamesStr + ") values (";
            for(var i=0; i<fieldValues.length; i++)
            {
                queryObj.queryString += (i===0 ? "" : ",") + queryObj.addQueryParam(fieldValues[i]);
            }
            queryObj.queryString += "); select SCOPE_IDENTITY() as [identity];";
            queryObj.execute(ctx, successCb, completeCb);
        };

        this.update = function(ctx, entity, updateFields, condition, successCb, completeCb)
        {
            var queryObj = new _this.query.Query();
            var tableName = entity + "table";
            var setClause = "";
            for(var fieldName in updateFields)
            {
                if(!updateFields.hasOwnProperty(fieldName)) 
                    continue;
                setClause += (setClause === "" ? "": ",") + fieldName + "=" + queryObj.addQueryParam(updateFields[fieldName]);
            }
            queryObj.queryString = "update [" + tableName + "] set " + setClause + " where " + condition.getWhereExpression(queryObj);
            queryObj.execute(ctx, successCb, completeCb);
        };

        this.delete = function(ctx, entity, id, successCb, completeCb)
        {
            var queryObj = new _this.query.Query();
            var tableName = entity + "table";
            var condition = new _this.condition.Condition(entity, "id", "=", id);
            queryObj.queryString = "delete from [" + tableName + "] where " + condition.getWhereExpression(queryObj);
            queryObj.execute(ctx, successCb, completeCb);
        };

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

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
    }
};