import { INameValueMap } from "../../src/types";
import { Runner } from "./runner";

export interface ITestQuery
{
    name?: string,
    string?: string,
    params?: INameValueMap,
    dialect?: string
}

export interface ITestSuite
{
    run: (runner:Runner, params:any) => void;
}