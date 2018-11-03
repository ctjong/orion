import { Database } from "./database";
import { Storage } from "./storage";

// General

export interface NameValueMap {[key:string]:any};
export class Join { e1:string; e2:string; e2Alias:string; e1JoinField:string; e2JoinField:string; e2SelectFields:string };
export interface UploadFileResponse { error: any; name: string };
export class Error { tag:string; statusCode:number; msg:string; stack?:any };

// Entities and fields

export interface Field { type:string; isEditable:boolean; createReq:number; foreignKey:any };
export interface FieldSet { [key:string]:Field };
export interface Entity 
{ 
    fields: FieldSet; 
    allowedRoles?: {[key:string]:string[]}; unique?:string[]; 
    getReadCondition?: (roles:string[], userId:string)=>string; 
    isWriteAllowed?: (action:string, roles:string[], userId:string, dbResource:any, inputResource:any) => boolean 
};
export interface EntitySet { [key:string]:Entity };

// Contexts

export class UserInfo { tokenExpiry:number; name?:string; roles?:string[]; domain?:string; id?:string; domainId?:string };
export class Context { config:Config; req:any; res:any; entity?:string; user?:UserInfo; db:Database; storage?:Storage };

// Conditions

export interface Condition { isCompound:boolean; operator:string; findConditionValue:((key:string)=>string) };
export class SingleCondition implements Condition { isCompound:boolean = false; operator:string; fieldName:string; fieldValue:string; entity:string; findConditionValue:((key:string)=>string) };
export class CompoundCondition implements Condition { isCompound:boolean = true; operator:string; children:Condition[]; findConditionValue:((key:string)=>string) };

// Configs

export interface DatabaseConfig { engine:string; connectionString:string; };
export interface StorageConfig { provider:string; azureStorageConnectionString?:string; azureStorageContainerName?:string; awsAccessKeyId?:string; 
    awsSecretAccessKey?:string; s3Bucket?:string; uploadPath?:string; };
export interface PasswordConfig { minLength:number; uppercaseChar:boolean; lowercaseChar:boolean; digitChar:boolean; specialChar:boolean; };
export interface AuthConfig { secretKey:string; salt?:string; tokenLifetimeInMins?:number; passwordReqs?:PasswordConfig; };
export interface MonitoringConfig { appInsightsKey:string; };
export interface Config { database:DatabaseConfig; storage?:StorageConfig; auth?:AuthConfig; monitoring?:MonitoringConfig; entities:EntitySet; };
