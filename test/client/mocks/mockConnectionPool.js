/**
 * A mock connection pool module
 */
export class MockConnectionPool
{
    dialect;
    queryResults;
    queryReceivedHandler;

    sql =
        {
            BigInt: "bigint",
            Request: MssqlRequest
        };

    constructor(dialect)
    {
        this.dialect = dialect;
        this.queryResults = [];
        this.queryReceivedHandler = null;
    }

    /**
     * Execute a MYSQL query
     * @param queryString Query string
     * @param queryParams Query params
     * @param callback callback function
     */
    query(queryString, queryParams, callback)
    {
        this.processQuery(this.dialect, queryString, queryParams, callback);
    }

    /**
     * Set the results for the active query
     * @param nextQueryResultsArg query results
     */
    setQueryResults(nextQueryResultsArg)
    {
        this.queryResults = nextQueryResultsArg;
    }

    /**
     * To be invoked when a query is received to be sent to database
     * @param queryReceivedHandlerArg handler function
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
     * Process a query.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param dialect dialect
     * @param queryString query string
     * @param queryParams query parameters
     * @param callback callback function
     */
    processQuery(dialect, queryString, queryParams, callback)
    {
        if (this.queryReceivedHandler)
            this.queryReceivedHandler(queryString, queryParams, dialect);
        queryString = queryString.toLowerCase();

        let currentQueryResults = this.queryResults;
        this.queryResults = [];

        if (currentQueryResults.length === 0 && queryString.indexOf("insert into") >= 0)
            currentQueryResults = { "lastinsertedid": "1" };
        if (typeof currentQueryResults.lastinsertedid !== "undefined")
        {
            if (dialect === "mssql")
                currentQueryResults = [{ "identity": currentQueryResults.lastinsertedid }];
            else
                currentQueryResults = { "insertId": currentQueryResults.lastinsertedid };
        }

        if (typeof currentQueryResults.count !== "undefined")
        {
            if (dialect === "mssql")
                currentQueryResults = [{ "": currentQueryResults.count }];
            else
                currentQueryResults = [{ "count": currentQueryResults.count }];
        }

        if (dialect === "mssql")
            callback(null, { recordset: currentQueryResults });
        else
            callback(null, currentQueryResults, []);
    }
};

/**
 * MSSQL request object to be included in the mock pool
 */
class MssqlRequest
{
    pool = null;
    inputQueryParams = {};

    constructor(pool)
    {
        this.pool = pool;
    }

    input(arg0, arg1, arg2)
    {
        this.inputQueryParams[arg0] = !arg2 ? ["string", arg1] : [arg1, arg2];
    }

    query(queryString, callback)
    {
        this.pool.processQuery(this.pool.dialect, queryString, this.inputQueryParams, callback);
    }
}
