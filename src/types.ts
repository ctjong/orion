export interface Field { type: string; isEditable: boolean; createReq: number; foreignKey: any };
export interface FieldSet { [key:string]: Field };
export interface Entity { fields: FieldSet; allowedRoles: { [key:string]: string[] } };
export interface EntitySet { [key:string]: Entity };
export interface Config { entities: EntitySet; database: any; storage: any; monitoring: any; dbms: any };