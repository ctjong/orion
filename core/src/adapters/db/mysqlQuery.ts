import { INameValueMap } from "../../types";

/**
 * A class representing an MYSQL query object
 */
export class MysqlQuery
{
    paramsCounter:number;
    queryString:string;
    queryParams:INameValueMap;

    constructor()
    {
        this.paramsCounter = 0;
        this.queryString = "";
        this.queryParams = [];
    }

    /**
     * Append the given string and params to the query
     */
    append(...args:string[]): void
    {
        const str = args[0];
        if (!str)
            return;
        if (args.length > 1)
        {
            for (let i = 1; i < args.length; i++)
            {
                this.queryParams.push(args[i]);
            }
        }
        this.queryString += str;
    }

    /**
     * Get the query string
     */
    getQueryString(): string
    {
        return this.queryString;
    }

    /**
     * Get the query parameters
     */
    getQueryParams(): INameValueMap
    {
        return this.queryParams;
    }
}