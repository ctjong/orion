/**
 * A mock mssql provider module
 */
var mock = 
{
    connectSuccess: true,
    queryFunction: null,
    queryResults: null,
    setConnectSuccess: function(isSuccess)
    {
        mock.connectSuccess = isSuccess;
    },
    setQueryFunction: function(queryFunction)
    {
        mock.queryFunction = queryFunction;
    },
    setQueryResults: function(queryResults)
    {
        mock.queryResults = queryResults;
    },
    reset: function()
    {
        mock.connectSuccess = true;
        mock.queryFunction = null;
        mock.queryResults = null;
    },
    connect: function(callback)
    {
        callback(mock.connectSuccess ? null : "error");
    },
    sql: 
    {
        Request: function(connection)
        {
            this.inputQueryParams = {};
            this.input = function(arg0, arg1, arg2)
            {
                inputQueryParams[arg0] = !arg2 ? ["string", arg1] :  [arg1, arg2];
            };
            this.query = function(queryString, callback)
            {
                mock.queryFunction(queryString, this.inputQueryParams);
                callback(mock.queryResults ? null : "error", mock.queryResults);
            };
        },
        BigInt: "bigint"
    }
};

module.exports = mock;