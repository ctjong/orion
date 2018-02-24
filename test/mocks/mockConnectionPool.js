/**
 * A mock connection pool module
 */
var mock = function(engine)
{
    var connectSuccess = true;
    var querySuccess = true;
    var queryReceivedHandler = null;
    var inputQueryParams = null;

    //----------------------------------------------
    // CONSTRUCTOR
    //----------------------------------------------

    function _construct() { }

    //----------------------------------------------
    // PUBLIC
    //----------------------------------------------

    var mssql =
    {
        InputQueryParams: null,
        Request: function(connection)
        {
            mssql.InputQueryParams = {};
            this.input = function(arg0, arg1, arg2)
            {
                mssql.InputQueryParams[arg0] = !arg2 ? ["string", arg1] : [arg1, arg2];
            };
            this.query = function(queryString, callback)
            {
                processQuery(queryString, mssql.InputQueryParams, callback);
            };
        },
        BigInt: "bigint"
    };

    function mssqlConnect(callback)
    {
        callback(connectSuccess ? null : "error");
    }

    function mysqlGetConnection(callback)
    {
        var connection = 
        {
            query: function(queryString, queryParams, callback)
            {
                processQuery(queryString, queryParams, callback);
            }
        };
        callback(connectSuccess ? null : "error", connection);
    }

    function setConnectSuccess(connectSuccessArg)
    {
        connectSuccess = connectSuccessArg;
    }

    function setQuerySuccess(querySuccessArg)
    {
        querySuccess = querySuccessArg;
    }

    function onQueryReceived(queryReceivedHandlerArg)
    {
        queryReceivedHandler = queryReceivedHandlerArg;
    }

    function reset()
    {
        connectSuccess = true;
        querySuccess = true;
        queryReceivedHandler = null;
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    function processQuery(queryString, queryParams, callback)
    {
        if(queryReceivedHandler)
            queryReceivedHandler(queryString, queryParams);
        if(!querySuccess)
            doCallback(callback, false);
        else if(queryString.toLowerCase().indexOf("insert") >= 0)
            doCallback(callback, true, [{'identity':'1'}]);
        else if(queryString.toLowerCase().indexOf("count(*)") >= 0)
            doCallback(callback, true, [{'':'1'}]);
        else
            doCallback(callback, true, []);
    }

    function doCallback(callback, isSuccess, results)
    {
        var errObject = isSuccess ? null : "error";
        if(engine === "mssql")
            callback(null, {recordset: results});
        else
            callback(null, results, []);
    }

    this.sql = mssql;
    this.connect = mssqlConnect;
    this.getConnection = mysqlGetConnection;
    this.setConnectSuccess = setConnectSuccess;
    this.setQuerySuccess = setQuerySuccess;
    this.onQueryReceived = onQueryReceived;
    this.reset = reset;
    _construct();
};

module.exports = mock;