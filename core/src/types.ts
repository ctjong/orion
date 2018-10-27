export interface Field { type:string; isEditable:boolean; createReq:number; foreignKey:any };
export interface FieldSet { [key:string]:Field };
export interface Entity 
{ 
    fields: FieldSet; 
    allowedRoles?: {[key:string]:string[]}, 
    getReadCondition?: (roles:string[], userId:string)=>string, 
    isWriteAllowed?: (action:string, roles:string[], userId:string, dbResource:any, inputResource:any) => boolean
};
export interface EntitySet { [key:string]:Entity };
export interface Config { entities:EntitySet; database:any; storage:any; monitoring:any; auth:any };

export class UserInfo { tokenExpiry:number; name?:string; roles?:string[]; domain?:string; id?:string; domainId?:string };

export class Context { config:Config; req:any; res:any; entity?:string; user?:UserInfo; };

export interface Condition { operator:string; findConditionValue:((key:string)=>string) };
export class SingleCondition implements Condition { operator:string; fieldName:string; fieldValue:string; entity:string; findConditionValue:((key:string)=>string) };
export class CompoundCondition implements Condition { operator:string; children:Condition[]; findConditionValue:((key:string)=>string) };

export interface NameValueMap {[key:string]:any};

export class Join { e1:string; e2:string; e2Alias:string; e1JoinField:string; e2JoinField:string; e2SelectFields:string };