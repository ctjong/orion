/**
 * A mock mysql provider module
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
    getConnection: function(callback)
    {
        var connection = 
        {
            query: function(queryString, queryParams, callback)
            {
                mock.queryFunction(queryString, queryParams);
                callback(mock.queryResults ? null : "error", mock.queryResults, []);
            }
        };
        callback(mock.connectSuccess ? null : "error", connection);
    }
};

module.exports = mock;