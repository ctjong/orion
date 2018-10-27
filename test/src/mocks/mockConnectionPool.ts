import { NameValueMap } from "../../../core/src/types";

/**
 * A mock connection pool module
 */
export class MockConnectionPool
{
    engine:string;
    sql:any;
    queryResults:any;
    queryReceivedHandler:any;

    constructor(engine:string)
    {
        this.engine = engine;
        this.sql = new MssqlWrapper(this);
        this.queryResults = [];
        this.queryReceivedHandler = null;
    }

    /**
     * Execute a MYSQL query
     * @param queryString Query string
     * @param queryParams Query params
     * @param callback callback function
     */
    query (queryString:string, queryParams:NameValueMap, callback:any)
    {
        this.processQuery(this.engine, queryString, queryParams, callback);
    }

    /**
     * Set the results for the active query
     * @param nextQueryResultsArg query results
     */
    setQueryResults(nextQueryResultsArg:any)
    {
        this.queryResults = nextQueryResultsArg;
    }

    /**
     * To be invoked when a query is received to be sent to database
     * @param queryReceivedHandlerArg handler function
     */
    onQueryReceived(queryReceivedHandlerArg:any)
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
     * @param engine engine
     * @param queryString query string
     * @param queryParams query parameters
     * @param callback callback function
     */
    processQuery(engine:string, queryString:string, queryParams:NameValueMap, callback:any)
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

/**
 * MSSQL wrapper object containing database connection functions and properties
 */
class MssqlWrapper
{
    pool:any;
    inputQueryParams:any = null;
    BigInt:string = "bigint";

    constructor(pool:any)
    {
        this.pool = pool
    }

    Request()
    {
        this.inputQueryParams = {};
        const obj =
        {
            input : (arg0:any, arg1:any, arg2:any) =>
            {
                this.inputQueryParams[arg0] = !arg2 ? ["string", arg1] : [arg1, arg2];
            },
            query : (queryString:string, callback:any) =>
            {
                this.pool.processQuery(this.pool.engine, queryString, this.inputQueryParams, callback);
            }
        };
        return obj;
    }
};
