/**
 * A mock mssql adapter module
 */
module.exports = 
{
    ConnectionPool: function(connectionString)
    {
        this.connect = function(callback)
        {
            //callback=fn(err)
            //TODO
        };
    },
    Request: function(connection)
    {
        this.input = function(arg0, arg1, arg2)
        {
            //args=(paramKey,type,paramVal)/(paramKey,paramVal)
            //TODO
        };
        this.query = function(queryString, callback)
        {
            //callback=fn(err,dbResponse)
            //TODO
        };
    },
    BigInt: "bigint"
};