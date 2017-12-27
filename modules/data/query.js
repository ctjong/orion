module.exports = 
{
    dependencies: ["sql", "exec"],
    Instance: function()
    {
        var _this = this;

        this.Query = function()
        {
            var _query = this;
            var paramsCounter = 0;
            var queryParams = {};

            this.queryString = null;

            this.addQueryParam = function(paramValue)
            {
                queryParams["value" + paramsCounter] = paramValue;
                return "@value" + paramsCounter++;
            };

            this.execute = function(ctx, successCb, completeCb)
            {
                console.log("-------------------------------------------------");
                console.log("Sending query to database:");
                console.log(_query.queryString);
                console.log("Query parameters:");
                console.log(queryParams);
                var connection = new _this.sql.ConnectionPool(ctx.config.databaseConnectionString);
                connection.connect(function(err)
                {
                    if(err)
                    {
                        if(!!completeCb) 
                            _this.exec.safeExecute(ctx, completeCb);
                        console.log(err);
                        throw new _this.error.Error("f8cb", 500, "error while connecting to database");
                    }
                    var request = new _this.sql.Request(connection);
                    for(var key in queryParams)
                    {
                        if(!queryParams.hasOwnProperty(key))
                            continue;
                        var paramValue = queryParams[key];
                        if(typeof(paramValue) === "number" && Math.abs(paramValue) > 2147483647)
                        {
                            request.input(key, _this.sql.BigInt, paramValue);
                        }
                        else
                        {
                            request.input(key, paramValue);
                        }
                    }
                    request.query(_query.queryString, function(err, dbResponse)
                    {
                        if(err)
                        {
                            if(!!completeCb)
                                _this.exec.safeExecute(ctx, completeCb);
                            console.log(err);
                            throw new _this.error.Error("a07f", 500, "error while sending query to database");
                        }
                        else
                        {
                            _this.exec.safeExecute(ctx, function()
                            {
                                successCb(dbResponse.recordset);
                            });
                            if(!!completeCb) 
                            {
                                _this.exec.safeExecute(ctx, completeCb);
                            }
                        }
                    });
                });
                console.log("-------------------------------------------------");
            };
        };
    }
};