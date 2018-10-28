"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A class representing an MYSQL query object
 */
class MysqlQuery {
    constructor() {
        this.paramsCounter = 0;
        this.queryString = "";
        this.queryParams = [];
    }
    /**
     * Append the given string and params to the query
     */
    append(...args) {
        const str = args[0];
        if (!str)
            return;
        if (args.length > 1) {
            for (let i = 1; i < args.length; i++) {
                this.queryParams.push(args[i]);
            }
        }
        this.queryString += str;
    }
    /**
     * Get the query string
     */
    // Get the query string
    getQueryString() {
        return this.queryString;
    }
    /**
     * Get the query parameters
     */
    getQueryParams() {
        return this.queryParams;
    }
}
exports.MysqlQuery = MysqlQuery;
