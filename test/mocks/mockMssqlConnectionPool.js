/**
 * A mock mssql provider module
 */
var mock = 
{
    connectSuccess: true,
    querySuccess: true,
    queryChecker: null,
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
        mock.querySuccess = true;
        mock.queryChecker = null;
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
                else if(queryString.toLowerCase().indexOf("insert") >= 0)
                    callback(null, {recordset: [{'identity':'1'}]});
                else if(queryString.toLowerCase().indexOf("count(*)") >= 0)
                    callback(null, {recordset: [{'':'1'}]});
                else
                    callback(null, {recordset: []});
            };
        },
        BigInt: "bigint"
    }
};

module.exports = mock;