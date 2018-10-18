/**
 * A mock connection pool module
 */
module.exports = class MockConnectionPool
{
    constructor(engine)
    {
        this.engine = engine;
        this.sql = new MssqlWrapper(this);
        this.queryResults = [];
        this.queryReceivedHandler = null;
    }

    /**
     * Execute a MYSQL query
     * @param {*} queryString Query string
     * @param {*} queryParams Query params
     * @param {*} callback callback function
     */
    query (queryString, queryParams, callback)
    {
        this.processQuery(this.engine, queryString, queryParams, callback);
    }

    /**
     * Set the results for the active query
     * @param {*} nextQueryResultsArg query results
     */
    setQueryResults(nextQueryResultsArg)
    {
        this.queryResults = nextQueryResultsArg;
    }

    /**
     * To be invoked when a query is received to be sent to database
     * @param {*} queryReceivedHandlerArg handler function
     */
    onQueryReceived(queryReceivedHandlerArg)
    {
        this.queryReceivedHandler = queryReceivedHandlerArg;
    }

    /** 
     * Reset the mock connection pool
     */
    reset()
    {
        this.queryReceivedHandler = null;
    }

    /**
     * Process a query
     * @param {*} engine engine
     * @param {*} queryString query string
     * @param {*} queryParams query parameters
     * @param {*} callback callback function
     */
    processQuery(engine, queryString, queryParams, callback)
    {
        if(this.queryReceivedHandler)
            this.queryReceivedHandler(queryString, queryParams, engine);
        queryString = queryString.toLowerCase();

        let currentQueryResults = this.queryResults;
        this.queryResults = [];

        if(currentQueryResults.length === 0 && queryString.indexOf("insert into") >= 0)
            currentQueryResults = {"lastinsertedid":"1"};
        if(typeof currentQueryResults.lastinsertedid !== "undefined")
        {
            if(engine === "mssql")
                currentQueryResults = [{"identity": currentQueryResults.lastinsertedid}];
            else
                currentQueryResults = {"insertId": currentQueryResults.lastinsertedid};
        }

        if(typeof currentQueryResults.count !== "undefined")
        {
            if(engine === "mssql")
                currentQueryResults = [{"": currentQueryResults.count}];
            else
                currentQueryResults = [{"count": currentQueryResults.count}];
        }

        if(engine === "mssql")
            callback(null, {recordset: currentQueryResults});
        else
            callback(null, currentQueryResults, []);
    }
};


//----------------------------------------------
// PRIVATE
//----------------------------------------------

/**
 * MSSQL wrapper object containing database connection functions and properties
 */
class MssqlWrapper
{
    constructor(pool)
    {
        this.pool = pool
        this.InputQueryParams = null;
        this.BigInt = "bigint";
    }

    Request()
    {
        this.InputQueryParams = {};
        const obj =
        {
            input : (arg0, arg1, arg2) =>
            {
                this.InputQueryParams[arg0] = !arg2 ? ["string", arg1] : [arg1, arg2];
            },
            query : (queryString, callback) =>
            {
                this.pool.processQuery(this.pool.engine, queryString, this.InputQueryParams, callback);
            }
        };
        return obj;
    }
};
