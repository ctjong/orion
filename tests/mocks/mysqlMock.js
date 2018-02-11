/**
 * A mock mysql adapter module
 */
module.exports = 
{
    createConnection: function(connectionConfig)
    {
        /*
            connectionConfig = {
                host: connProps.server,
                user: connProps.uid,
                password: connProps.pwd,
                database: connProps.database,
                multipleStatements: true
            }
        */
        this.connect = function(callback)
        {
            //callback=fn(err)
            //TODO
        };
        this.query = function(queryString, queryParams, callback)
        {
            //callback=fn(error,results,fields)
            //TODO
        };
    }
};