import { IDatabaseAdapter } from "./database/iDatabaseAdapter";
import { IStorageAdapter } from "./storage/iStorageAdapter";

// General

export interface INameValueMap {[key:string]:any};
export class Join { e1:string; e2:string; e2Alias:string; e1JoinField:string; e2JoinField:string; e2SelectFields:string };
export interface IUploadFileResponse { error: any; name: string };
export class Error { tag:string; statusCode:number; msg:string; stack?:any };

// Entities and fields

// type can be "string" / "text" / "int" / "float" / "boolean" / "secret"
export interface IFieldConfig { type:string; isEditable:boolean; createReq:number; foreignKey:IForeignKeyConfig };
export interface IFieldConfigSet { [key:string]:IFieldConfig };
export interface IEntityConfig 
{ 
    fields: IFieldConfigSet; 
    allowedRoles?: {[key:string]:string[]}; unique?:string[]; 
    getReadCondition?: (roles:string[], userId:string)=>string; 
    isWriteAllowed?: (action:string, roles:string[], userId:string, dbResource:any, inputResource:any) => boolean 
};
export interface IEntityConfigSet { [key:string]:IEntityConfig };
export interface IForeignKeyConfig { foreignEntity:string; resolvedKeyName:string };

// Contexts

export class UserInfo { tokenExpiry:number; name?:string; roles?:string[]; domain?:string; id?:string; domainId?:string };
export class Context { config:IConfig; req:any; res:any; entityName?:string; user?:UserInfo; db:IDatabaseAdapter; storage?:IStorageAdapter };

// Conditions

export interface ICondition { isCompound:boolean; operator:string; findConditionValue:((key:string)=>string) };
export class SingleCondition implements ICondition { isCompound:boolean = false; operator:string; fieldName:string; fieldValue:string; entityName:string; findConditionValue:((key:string)=>string) };
export class CompoundCondition implements ICondition { isCompound:boolean = true; operator:string; children:ICondition[]; findConditionValue:((key:string)=>string) };

// Configs

export interface IDatabaseConfig { engine:string; connectionString:string; };
export interface IStorageConfig { provider:string; azureStorageConnectionString?:string; azureStorageContainerName?:string; awsAccessKeyId?:string; 
    awsSecretAccessKey?:string; s3Bucket?:string; uploadPath?:string; };
export interface IPasswordConfig { minLength:number; uppercaseChar:boolean; lowercaseChar:boolean; digitChar:boolean; specialChar:boolean; };
export interface IAuthConfig { secretKey:string; salt?:string; tokenLifetimeInMins?:number; passwordReqs?:IPasswordConfig; };
export interface IMonitoringConfig { appInsightsKey:string; };
export interface IConfig { database:IDatabaseConfig; storage?:IStorageConfig; auth?:IAuthConfig; monitoring?:IMonitoringConfig; entities:IEntityConfigSet; };
