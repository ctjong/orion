/**
 * A module to handle read operations
 */
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

        /**
         * Handle a read request
         * @param {any} ctx Request context
         * @param {any} requestParams Request parameters
         * @param {any} isFullMode Whether to do the read in full mode (full mode = include rich text fields in response)
         */
        function execute (ctx, requestParams, isFullMode)
        {
            // set owner role if the read operation is run in private mode
            if (requestParams.accessType === "private")
            {
                // private read mode. add owner role directly, add ownerid condition later
                if (!ctx.userId) throw new _this.error.Error("a058", 401, "Unauthorized");
                ctx.userRoles.push("owner");
            }

            // verify that current user context is allowed to execute a read
            _this.helper.validateRoles(ctx, "read");

            // get pagination and ordering info
            var skip = isNaN(parseInt(requestParams.skip)) ? 0 : parseInt(requestParams.skip);
            var take = isNaN(parseInt(requestParams.take)) ? 10 : parseInt(requestParams.take);
            var orderByField = !requestParams.orderByField ? "id" : requestParams.orderByField;

            // get condition
            var configConditionStr = getConditionStringFromConfig(ctx, requestParams.accessType);
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

        /**
         * Get condition string from config
         * @param {any} ctx Request context
         * @returns condition string
         */
        function getConditionStringFromConfig(ctx)
        {
            var entityConfig = ctx.config.entities[ctx.entity];
            if (!entityConfig.getReadCondition)
                return "";
            return entityConfig.getReadCondition(ctx.userRoles, ctx.userId);
        }

        /**
         * Get Condition object from the request
         * @param {any} ctx Request context
         * @param {any} requestParams Request parameters
         * @returns Condition object
         */
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

        this.execute = execute;
        _construct();
    }
};