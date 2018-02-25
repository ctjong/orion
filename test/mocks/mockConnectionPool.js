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

    /**
     * MSSQL object containing database connection functions and properties
     */
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

    /**
     * Connect to an MSSQL database
     * @param {*} callback callback function
     */
    function mssqlConnect(callback)
    {
        callback(connectSuccess ? null : "error");
    }

    /**
     * Get a connection object for connecting with an MYSQL database
     * @param {*} callback callback function
     */
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

    /**
     * Set whether or not connect requests should succeed
     * @param {*} connectSuccessArg connect requests result
     */
    function setConnectSuccess(connectSuccessArg)
    {
        connectSuccess = connectSuccessArg;
    }

    /**
     * Set whether or not query requests should succeed
     * @param {*} connectSuccessArg query requests result
     */
    function setQuerySuccess(querySuccessArg)
    {
        querySuccess = querySuccessArg;
    }

    /**
     * To be invoked when a query is received to be set to database
     * @param {*} queryReceivedHandlerArg handler function
     */
    function onQueryReceived(queryReceivedHandlerArg)
    {
        queryReceivedHandler = queryReceivedHandlerArg;
    }

    /** 
     * Reset the mock connection pool
     */
    function reset()
    {
        connectSuccess = true;
        querySuccess = true;
        queryReceivedHandler = null;
    }

    //----------------------------------------------
    // PRIVATE
    //----------------------------------------------

    /**
     * Process a query
     * @param {*} queryString query string
     * @param {*} queryParams query parameters
     * @param {*} callback callback function
     */
    function processQuery(queryString, queryParams, callback)
    {
        if(queryReceivedHandler)
            queryReceivedHandler(queryString, queryParams);

        var results = [];
        if(queryString.toLowerCase().indexOf("insert") >= 0)
            results = [{'identity':'1'}];
        else if(queryString.toLowerCase().indexOf("count(*)") >= 0)
            results = [{'':'1'}];

        if(!querySuccess)
            callback("error");
        else if(engine === "mssql")
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