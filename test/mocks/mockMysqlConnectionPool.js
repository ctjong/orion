/**
 * A mock mysql provider module
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
    getConnection: function(callback)
    {
        var connection = 
        {
            query: function(queryString, queryParams, callback)
            {
                if(mock.queryChecker)
                    mock.queryChecker(queryString, mock.inputQueryParams);
                if(!mock.querySuccess)
                    callback("error");
                else if(queryString.toLowerCase().indexOf("insert") >= 0)
                    callback(null, [{'identity':'1'}], []);
                else if(queryString.toLowerCase().indexOf("count(*)") >= 0)
                    callback(null, [{'':'1'}], []);
                else
                    callback(null, [], []);
            }
        };
        callback(mock.connectSuccess ? null : "error", connection);
    }
};

module.exports = mock;