/**
 * A mock mssql provider module
 */
var mock = 
{
    connectSuccess: true,
    queryChecker: null,
    querySuccess: null,
    inputQueryParams: null,
    setConnectSuccess: function(isSuccess)
    {
        mock.connectSuccess = isSuccess;
    },
    setQueryChecker: function(queryChecker)
    {
        mock.queryChecker = queryChecker;
    },
    setQuerySuccess: function(querySuccess)
    {
        mock.querySuccess = querySuccess;
    },
    reset: function()
    {
        mock.connectSuccess = true;
        mock.queryChecker = null;
        mock.querySuccess = null;
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
                if(mock.queryChecker)
                    mock.queryChecker(queryString, mock.inputQueryParams);
                if(!mock.querySuccess)
                    callback("error");
                else if(queryString.toLowerCase().indexOf("insert"))
                    callback(null, {recordset: [{'identity':'1'}]});
                else
                    callback(null, {recordset: []});
            };
        },
        BigInt: "bigint"
    }
};

module.exports = mock;