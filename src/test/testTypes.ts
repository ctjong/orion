import { INameValueMap } from "../core/types";
import { Runner } from "./runner";

export interface ITestQuery
{
    name?: string,
    string?: string,
    params?: INameValueMap,
    engine?: string
}

export interface ITestSuite
{
    run: (runner:Runner, params:any) => void;
}