/**
 * A mock mssql provider module
 */
module.exports = 
{
    connect: function(err)
    {
        //TODO
    },
    sql: 
    {
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
    }
};