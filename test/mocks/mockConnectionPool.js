/**
 * A mock connection pool module
 */
var mock = function(engine)
{
    // TODO: expand results options

    var resultsOptions = 
    [
        {
            queryKeywords: ["count(*)"],
            queryParams: {},
            results: [{'':'1'}]
        },
        {
            queryKeywords: ["insert into"],
            queryParams: {},
            results: [{'identity':'1'}]
        }
    ];

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
        queryString = queryString.toLowerCase();

        var results = [];
        for(var i=0; i<resultsOptions.length; i++)
        {
            var option = resultsOptions[i];
            var isMatch = true;
            for(var j=0; j<option.queryKeywords.length; j++)
            {
                var keyword = option.queryKeywords[j];
                if (queryString.indexOf(keyword) < 0)
                {
                    isMatch = false;
                    break;
                }
            }
            if(!isMatch)
                continue;

            for(var paramKey in option.queryParams)
            {
                if(!option.queryParams.hasOwnProperty(paramKey))
                    continue;
                if(queryParams[paramKey] !== option.queryParams[paramKey])
                {
                    isMatch = false;
                    break;
                }
            }
            if(!isMatch)
                continue;

            results = option.results;
            break;
        }

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