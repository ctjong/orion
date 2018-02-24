/**
 * A mock mssql provider module
 */
var mock = 
{
    connectSuccess: true,
    queryFunction: null,
    queryResults: null,
    inputQueryParams: null,
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
            mock.inputQueryParams = {};
            this.input = function(arg0, arg1, arg2)
            {
                mock.inputQueryParams[arg0] = !arg2 ? ["string", arg1] :  [arg1, arg2];
            };
            this.query = function(queryString, callback)
            {
                if(mock.queryFunction)
                    mock.queryFunction(queryString, mock.inputQueryParams);
                if(!mock.queryResults)
                    callback("error");
                else
                    callback(null, {recordset: mock.queryResults});
            };
        },
        BigInt: "bigint"
    }
};

module.exports = mock;