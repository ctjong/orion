/**
 * A mock mysql provider module
 */
var mock = 
{
    connectSuccess: true,
    queryChecker: null,
    querySuccess: null,
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
                else if(queryString.toLowerCase().indexOf("insert"))
                    callback(null, [{'identity':'1'}], []);
                else
                    callback(null, [], []);
            }
        };
        callback(mock.connectSuccess ? null : "error", connection);
    }
};

module.exports = mock;