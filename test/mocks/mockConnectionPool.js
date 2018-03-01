/**
 * A mock connection pool module
 */
var mock = function(engine)
{
    var queryResults = [];
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
        callback(null, connection);
    }

    /**
     * Set the results for the active query
     * @param {*} nextQueryResultsArg query results
     */
    function setQueryResults(nextQueryResultsArg)
    {
        queryResults = nextQueryResultsArg;
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
        nextQueryStatus = true;
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
            queryReceivedHandler(queryString, queryParams, engine);
        queryString = queryString.toLowerCase();

        var currentQueryResults = queryResults;
        queryResults = [];
        if(currentQueryResults.length === 0 && queryString.indexOf("insert into") >= 0)
            currentQueryResults = {"lastinsertedid":"1"};
        if(typeof currentQueryResults.lastinsertedid !== "undefined")
        {
            if(engine === "mssql")
                currentQueryResults = [{"identity": currentQueryResults.lastinsertedid}];
            else
                currentQueryResults = {"insertId": currentQueryResults.lastinsertedid};
        }

        if(engine === "mssql")
            callback(null, {recordset: currentQueryResults});
        else
            callback(null, currentQueryResults, []);
    }

    this.sql = mssql;
    this.connect = mssqlConnect;
    this.getConnection = mysqlGetConnection;
    this.setQueryResults = setQueryResults;
    this.onQueryReceived = onQueryReceived;
    this.reset = reset;
    _construct();
};

module.exports = mock;