import { INameValueMap } from "../../core/types";

/**
 * A mock connection pool module
 */
export class MockConnectionPool
{
    engine: string;
    queryResults: any;
    queryReceivedHandler: any;

    sql: any =
        {
            BigInt: "bigint",
            Request: MssqlRequest
        };

    constructor(engine: string)
    {
        this.engine = engine;
        this.queryResults = [];
        this.queryReceivedHandler = null;
    }

    /**
     * Execute a MYSQL query
     * @param queryString Query string
     * @param queryParams Query params
     * @param callback callback function
     */
    query(queryString: string, queryParams: INameValueMap, callback: any): void
    {
        this.processQuery(this.engine, queryString, queryParams, callback);
    }

    /**
     * Set the results for the active query
     * @param nextQueryResultsArg query results
     */
    setQueryResults(nextQueryResultsArg: any): void
    {
        this.queryResults = nextQueryResultsArg;
    }

    /**
     * To be invoked when a query is received to be sent to database
     * @param queryReceivedHandlerArg handler function
     */
    onQueryReceived(queryReceivedHandlerArg: any): void
    {
        this.queryReceivedHandler = queryReceivedHandlerArg;
    }

    /** 
     * Reset the mock connection pool
     */
    reset(): void
    {
        this.queryReceivedHandler = null;
    }

    /**
     * Process a query.
     * Note that this is using the old callback argument style instead of Promise because the purpose
     * of this function is to override the the library functions, which are not returning a Promise.
     * @param engine engine
     * @param queryString query string
     * @param queryParams query parameters
     * @param callback callback function
     */
    processQuery(engine: string, queryString: string, queryParams: INameValueMap, callback: any): void
    {
        if (this.queryReceivedHandler)
            this.queryReceivedHandler(queryString, queryParams, engine);
        queryString = queryString.toLowerCase();

        let currentQueryResults = this.queryResults;
        this.queryResults = [];

        if (currentQueryResults.length === 0 && queryString.indexOf("insert into") >= 0)
            currentQueryResults = { "lastinsertedid": "1" };
        if (typeof currentQueryResults.lastinsertedid !== "undefined")
        {
            if (engine === "mssql")
                currentQueryResults = [{ "identity": currentQueryResults.lastinsertedid }];
            else
                currentQueryResults = { "insertId": currentQueryResults.lastinsertedid };
        }

        if (typeof currentQueryResults.count !== "undefined")
        {
            if (engine === "mssql")
                currentQueryResults = [{ "": currentQueryResults.count }];
            else
                currentQueryResults = [{ "count": currentQueryResults.count }];
        }

        if (engine === "mssql")
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
    pool: any = null;
    inputQueryParams: any = {};

    constructor(pool: any)
    {
        this.pool = pool;
    }

    input(arg0: any, arg1: any, arg2: any): void
    {
        this.inputQueryParams[arg0] = !arg2 ? ["string", arg1] : [arg1, arg2];
    }

    query(queryString: string, callback: any): void
    {
        this.pool.processQuery(this.pool.engine, queryString, this.inputQueryParams, callback);
    }
}
