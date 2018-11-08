import { INameValueMap } from "../../types";

/**
 * A class representing an MSSQL query object
 */
export class MssqlQuery
{
    paramsCounter:number;
    queryString:string;
    queryParams:INameValueMap;

    constructor()
    {
        this.paramsCounter = 0;
        this.queryString = "";
        this.queryParams = {};
    }

    /**
     * Append the given string and params to the query
     */
    append(...args:string[]): void
    {
        let str = args[0];
        if (!str)
            return;
        if (args.length > 1)
        {
            let newStr = "";
            let currentArgIndex = 1;
            for (let i = 0; i < str.length; i++)
            {
                if (str[i] !== "?")
                {
                    newStr += str[i];
                    continue;
                }
                newStr += "@value" + this.paramsCounter + " ";
                this.queryParams["value" + this.paramsCounter] = args[currentArgIndex];
                this.paramsCounter++;
                currentArgIndex++;
            }
            str = newStr;
        }
        this.queryString += str;
    }

    /**
     * Get the query string
     */
    // Get the query string
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