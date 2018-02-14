/**
 * A mock mysql provider module
 */
var mock = 
{
    getConnection: function(callback)
    {
        //callback=fn(err, connection)
        //connection={query: fn(queryString, queryParams, function (error, results, field){})}
        //TODO
    }
};

module.exports = mock;