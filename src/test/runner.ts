import { Config, NameValueMap } from "../core/types";
import Orion from "../core";
import { queries } from "./queries";
import { MockConnectionPool } from './mocks/mockConnectionPool';
import { MockStorageProvider } from './mocks/mockStorageProvider';
import * as chai from 'chai';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { TestQuery } from './testTypes';

const maxServerStartRetries = 10;


/**
 * Class for running a set of tests against a specific database/storage type
 * @param {*} config Config module
 * @param {*} dbEngine Database engine
 * @param {*} storageProviderName Storage provider name
 */
export class Runner
{
    config:Config;
    dbEngine:string;
    storageProviderName:string;
    app:Orion;
    pool:any;
    storageProvider:any;
    isServerStarted:boolean;

    /**
     * Initialize the runnner
     * @param config Config object
     * @param dbEngine Database engine name
     * @param storageProviderName Storage provider name
     */
    constructor(config:Config, dbEngine:string, storageProviderName:string)
    {
        chai.use(require("chai-http"));
        this.config = config;
        this.dbEngine = dbEngine;
        this.storageProviderName = storageProviderName;
        this.isServerStarted = false;
    }

    /**
     * Run a test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} reqMethod request method
     * @param {*} reqBody request body
     * @param {*} accessToken access token
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    runTest(name:string, reqUrl:string, reqMethod:string, reqBody:any, accessToken:string, 
        expectedQueries:TestQuery[], queryResults:any, expectedResponseCode:number, expectedResponseBody?:any)
    {
        it(name, (done) =>
        {
            const actualQueries:TestQuery[] = [];
            this.onBeforeRequest(actualQueries, queryResults);

            let requestAwaiter;
            const request = chai.request(this.app);
            if(reqMethod === "get")
                requestAwaiter = request.get(reqUrl);
            else if(reqMethod === "post")
                requestAwaiter = request.post(reqUrl).send(reqBody);
            else if(reqMethod === "put")
                requestAwaiter = request.put(reqUrl).send(reqBody);
            else if(reqMethod === "delete")
                requestAwaiter = request.del(reqUrl);
            if(accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end((err:any, res:any) =>
            {
                this.onAfterRequest(actualQueries, res, expectedQueries, expectedResponseCode, expectedResponseBody);
                done();
            });
        });
    }

    /**
     * Run a file upload test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} filePath path to the file to upload
     * @param {*} accessToken access token
     * @param {*} expectedMimeType expected MIME type of the uploaded file
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    runFileUploadTest(name:string, reqUrl:string, filePath:string, accessToken:string, expectedMimeType:string, 
        expectedQueries:TestQuery[], queryResults:any, expectedResponseCode:number, expectedResponseBody?:any)
    {
        it(name, (done) =>
        {
            const actualQueries:TestQuery[] = [];
            this.onBeforeRequest(actualQueries, queryResults);
            const inputFile = fs.readFileSync(filePath);
            const inputFileName = path.basename(filePath);
            let uploadedFileName:string = null;
            let uploadedFileMime:string = null;
            this.storageProvider.onFilePartReceived((name:string, mime:string) =>
            {
                uploadedFileName = name;
                uploadedFileMime = mime;
            });

            const requestAwaiter = chai.request(this.app)
                .post(reqUrl)
                .attach("file", inputFile, inputFileName);
            if(accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end((err, res) =>
            {
                try
                {
                    const uploadedFilePath = process.env.temp + "\\" + uploadedFileName;
                    const uploadedFile = fs.readFileSync(uploadedFilePath);
                    if(uploadedFileMime !== null)
                        assert.equal(uploadedFileMime, expectedMimeType, "Uploaded file's MIME type is incorrect");
                    assert(uploadedFile.equals(inputFile), "Uploaded file is not the identical to input file");

                    for(let i=0; i<expectedQueries.length; i++)
                        for(let j=0; j<expectedQueries[i].params.length; j++)
                            if(expectedQueries[i].params[j] === 'uploadedName')
                                expectedQueries[i].params[j] = uploadedFileName;

                    this.onAfterRequest(actualQueries, res, expectedQueries, expectedResponseCode, expectedResponseBody);
                }catch(e){}
                done();
            });
        });
    }

    /**
     * Run a file delete test
     * @param {*} name test name
     * @param {*} reqUrl request URL
     * @param {*} accessToken access token
     * @param {*} expectedQueries list of expected query strings and parameters
     * @param {*} queryResults results to return for each query
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    runFileDeleteTest(name:string, reqUrl:string, accessToken:string, expectedQueries:TestQuery[],
        queryResults:any, expectedResponseCode:number, expectedResponseBody?:any)
    {
        it(name, (done) =>
        {
            const actualQueries:TestQuery[] = [];
            const expectedFilename = queryResults[0][0].filename;
            this.onBeforeRequest(actualQueries, queryResults);
            let actualFilename:string = null;
            this.storageProvider.onFileDeleted((name:string) =>
            {
                actualFilename = name;
            });

            const requestAwaiter = chai.request(this.app).del(reqUrl);
            if(accessToken)
                requestAwaiter.set("Authorization", "Bearer " + accessToken);

            requestAwaiter.end((err:any, res:any) =>
            {
                assert.equal(actualFilename, expectedFilename, "Deleted file name is incorrect");
                this.onAfterRequest(actualQueries, res, expectedQueries, expectedResponseCode, expectedResponseBody);
                done();
            });
        });
    }

    /** 
     * Start an Orion app
     */
    async startServer()
    {
        if(this.isServerStarted)
            return;

        this.app = new Orion(this.config);
        this.app.setupApiEndpoints();

        this.pool = new MockConnectionPool(this.dbEngine);
        this.app.getDatabaseAdapter().setConnectionPool(this.pool);

        this.storageProvider = new MockStorageProvider();
        this.app.getStorageAdapter().setProvider(this.storageProvider);

        await this.startServerInternal(this.app, 0);
        this.isServerStarted = true;
    }

    /**
     * Start an Orion app
     * @param {*} orion orion app
     * @param {*} numRetries number of retries so far
     */
    startServerInternal(orion: Orion, numRetries: number): Promise<any>
    {
        return new Promise(resolve =>
        {
            if(numRetries > maxServerStartRetries)
                throw "Failed to start app. Max retries exceeded.";
            const port = 1337 + numRetries;
            orion.start(port, resolve).on("error", function()
            {
                this.startServerInternal(orion, numRetries + 1, resolve);
            });
        });
    }

    /** 
     * To be invoked before firing a request
     * @param {*} actualQueries Actual queries received by DB adapter
     * @param {*} queryResults List of results to be returned for each incoming query
     */
    onBeforeRequest(actualQueries: TestQuery[], queryResults: any): void
    {
        this.pool.reset();
        this.pool.onQueryReceived((actualString:string, actualParams:NameValueMap, engine:string) =>
        {
            actualQueries.push({ string: actualString, params: actualParams, engine: engine });
            if(queryResults && queryResults.length)
            this.pool.setQueryResults(queryResults.shift());
        });
    }

    /**
     * To be invoked after the response to a request has been received
     * @param {*} actualQueries actual queries received by DB adapter
     * @param {*} actualResponse actual response received
     * @param {*} expectedQueries expected queries to be received
     * @param {*} expectedResponseCode expected response status code
     * @param {*} expectedResponseBody expected response body
     */
    onAfterRequest(actualQueries:TestQuery[], actualResponse:any, expectedQueries:TestQuery[], 
        expectedResponseCode:number, expectedResponseBody:any): void
    {
        if(expectedQueries)
        {
            assert.equal(actualQueries.length, expectedQueries.length, "Number of received queries is not as expected");
            for(let i=0; i<expectedQueries.length; i++)
            {
                const actualString = actualQueries[i].string;
                const actualParams = actualQueries[i].params;
                const engine = actualQueries[i].engine;
                const expected = expectedQueries[i];
                const expectedString = queries[expected.name][engine];
                this.assetQueryString(actualString.trim().toLowerCase(), expectedString.trim().toLowerCase());
                for(let j=0; j<expected.params.length; j++)
                {
                    if(expected.params[i] === "skip")
                        continue;
                    const actualValue = engine === "mssql" ? actualParams["value" + j][1] : actualParams[j];
                    assert.equal(actualValue, expected.params[j], "Incorrect query parameter at index " + j + ". Actual: " + actualValue + ". Expected: " + expected.params[i]);
                }
            }
        }

        assert.equal(actualResponse.status, expectedResponseCode, "Status code " + actualResponse.status + " is not expected");
        const responseBody = Object.keys(actualResponse.body).length > 0 ? actualResponse.body : actualResponse.text;
        if(expectedResponseBody)
            this.assertResponseBody(responseBody, expectedResponseBody, "", "");
    }

    /**
     * Assert that a response body match the expected
     * @param {*} actual Actual response body
     * @param {*} expected Expected response body
     * @param {*} relativePath Path to the current value from object root
     * @param {*} currentKey Current object key
     */
    assertResponseBody(actual:any, expected:any, relativePath:string, currentKey:string): void
    {
        const fullPath = relativePath + "/" + currentKey;
        if(typeof actual === "undefined" || actual == null)
            assert.fail("Missing response body at " + fullPath);
        if(currentKey === "token")
        {
            try
            {
                actual = jwt.verify(actual, "samplestring");
            }
            catch(e)
            {
                assert.fail("Failed to decode token at " + fullPath + ".");
            }
        }
        if(typeof expected === "object")
        {
            for(const key in expected)
            {
                if(!expected.hasOwnProperty(key))
                    continue;
                const childExpected = expected[key];
                const childActual = actual[key];
                if(!actual)
                    assert.fail("Response body with key " + fullPath + "/" + key + " doesn't exist");
                this.assertResponseBody(childActual, childExpected, fullPath, key);
            }
        }
        else
        {
            assert.equal(actual, expected, "Incorrect response body value at " + fullPath + ". Actual: " + actual + ". Expected: " + expected);
        }
    }

    /**
     * Assert that a query string match the expected
     * @param {*} actual Actual query string
     * @param {*} expected Expected query string
     */
    assetQueryString(actual:string, expected:string): void
    {
        if(expected.indexOf("select") === 0)
        {
            this.assertQueryClause(actual, expected, "select", "from", ",");
            this.assertQueryClause(actual, expected, "from", "where", "innerjoin");
            const actualEnd = actual.substring(actual.indexOf("where"));
            const expectedEnd = expected.substring(expected.indexOf("where"));
            assert.equal(actualEnd, expectedEnd, "End of query string is not as expected");
        }
        else
        {
            assert.equal(actual, expected, "Query string does not match the expected");
        }
    }

    /**
     * Assert that a query clause matches the expected
     * @param {*} actual actual query string
     * @param {*} expected expected query string
     * @param {*} clauseStart start keyword of the query clause
     * @param {*} clauseEnd start keyword of the query clause
     * @param {*} separator separator string between each clause value
     */
    assertQueryClause(actual:string, expected:string, clauseStart:string, clauseEnd:string, separator:string): void
    {
        const actualValues = this.getQueryClauseValues(actual, clauseStart, clauseEnd, separator);
        const expectedValues = this.getQueryClauseValues(expected, clauseStart, clauseEnd, separator);
        if(actualValues.length !== expectedValues.length)
            return;
        actualValues.forEach((actualItem:string, index:number) =>
        {
            if(actualItem !== expectedValues[index])
            {
                assert.fail("Query clause is not as expected. Actual: [" + actualValues.join(",") + "]. Expected: [" + expectedValues.join(",") + "].");
            }
        });
    }

    /**
     * Get array of values from a query clause
     * @param {*} query query string
     * @param {*} clauseStart start keyword of the query clause
     * @param {*} clauseEnd start keyword of the query clause
     * @param {*} separator separator string between each clause value
     * @return array of values
     */
    getQueryClauseValues(query:string, clauseStart:string, clauseEnd:string, separator:string): string[]
    {
        const clauseStartIndex = query.indexOf(clauseStart);
        if(clauseStartIndex < 0)
            return [];
        else if(clauseStartIndex === 0) 
            clauseStart += " ";
        else
            clauseStart = " " + clauseStart + " ";
        const clauseBegin = query.indexOf(clauseStart) + clauseStart.length;
        let clause;
        if(!clauseEnd)
        {
            clause = query.substring(clauseBegin);
        }
        else
        {
            clauseEnd = " " + clauseEnd + " ";
            clause = query.substring(clauseBegin, query.indexOf(clauseEnd));
        }
        const values = clause.split(" ").join("").split(separator);
        values.sort();
        return values;
    }
}