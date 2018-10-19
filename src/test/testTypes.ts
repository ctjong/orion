import { NameValueMap } from "../core/types";
import { Runner } from "./runner";

export interface TestQuery
{
    name?: string,
    string?: string,
    params?: NameValueMap,
    engine?: string
}

export interface TestSuite
{
    run: (runner:Runner, params:any) => void;
}