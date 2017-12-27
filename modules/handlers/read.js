module.exports = 
{
    dependencies: ["helper", "condition", "join", "db", "auth"],
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

        this.execute = function(ctx, requestParams, isFullMode)
        {
            var configConditionStr = getConditionStringFromConfig(ctx, requestParams.accessType);
            if(typeof configConditionStr === "undefined" || configConditionStr === null)
                throw new _this.error.Error("a058", 401, "Unauthorized");
            var orderByField = !requestParams.orderByField ? "id" : requestParams.orderByField;

            // get pagination info
            var skip = isNaN(parseInt(requestParams.skip)) ? 0 : parseInt(requestParams.skip);
            var take = isNaN(parseInt(requestParams.take)) ? 10 : parseInt(requestParams.take);

            // get condition
            var condition = getConditionFromRequest(ctx, requestParams);
            if(configConditionStr !== "") 
            {
                condition.children.push(_this.condition.parse(ctx, configConditionStr));
            }

            // execute
            var fields = _this.helper.getFields(ctx, "read");
            _this.db.count(ctx, fields, ctx.entity, condition, true, function(countResponse)
            {
                var count = countResponse[0][""];
                _this.db.select(ctx, fields, ctx.entity, condition, orderByField, skip, take, true, isFullMode, function(dbResponse)
                {
                    for(var i=0; i<dbResponse.length; i++)
                    {
                        dbResponse[i] = _this.helper.fixDataKeysAndTypes(ctx, dbResponse[i]);
                    }
                    ctx.res.json({"count": count, "items": dbResponse});
                });
            });
        };

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        function getConditionStringFromConfig(ctx, accessType)
        {
            if(accessType === "private")
            {
                // private read mode. add owner role directly, add ownerid condition later
                if(!ctx.userId) throw new _this.error.Error("a058", 401, "Unauthorized");
                ctx.userRoles.push("owner");
            }
            var conditionStrings = ctx.config.entities[ctx.entity].readConditionStrings;
            if(!conditionStrings) return null;
            var conditionStr = null;
            for(var i=0; i<conditionStrings.length; i++)
            {
                if(ctx.userRoles.containsAny(conditionStrings[i].roles))
                {
                    conditionStr = conditionStrings[i].fn(ctx.userId);
                }
            }
            return conditionStr;
        }

        function getConditionFromRequest(ctx, requestParams)
        {
            var isPrivate = requestParams.accessType === "private";
            var condition = new _this.condition.CompoundCondition("&", []);
            if(!!requestParams.condition)
            {
                var conditionString = decodeURIComponent(requestParams.condition);
                condition.children.push(_this.condition.parse(ctx, conditionString));
            }
            else if(!!requestParams.id)
            {
                condition.children.push(new _this.condition.Condition(ctx.entity, "id", "=", requestParams.id));
            }
            if(isPrivate)
            {
                var fieldName = ctx.entity === "user" ? "id" : "ownerid";
                var val = parseInt(condition.getValue(fieldName));
                if(!isNaN(val) && val !== ctx.userId)
                {
                    throw new _this.error.Error("a19c", 401, "Unauthorized");
                }
                condition.children.push(new _this.condition.Condition(ctx.entity, fieldName, "=", ctx.userId));
            }
            return condition;
        }

        _construct();
    }
};