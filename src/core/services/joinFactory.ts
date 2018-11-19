import { Join, Context } from "../types";

class JoinFactory 
{
    /**
     * Create a Join object for resolving a foreign key
     * @param ctx Request context
     * @param entity Requested entity
     * @param field Foreign key field
     * @returns Join object
     */
    createForForeignKey(ctx: Context, entityName: string, field: string): Join
    {
        if (!entityName || !field)
            throw "[createForForeignKey] Missing entity/field";
        if (!ctx.config.entities[entityName])
            throw "[createForForeignKey] invalid entity";
        if (!ctx.config.entities[entityName].fields[field])
            throw "[createForForeignKey] invalid field";
        const fk = ctx.config.entities[entityName].fields[field].foreignKey;
        const e2 = fk.targetEntityName;
        const e2SelectFields = [];
        const e2SelectFieldObjs = ctx.config.entities[e2].fields;
        for (const key in e2SelectFieldObjs)
        {
            if (!e2SelectFieldObjs.hasOwnProperty(key))
                continue;
            if (e2SelectFieldObjs[key].type === "secret")
                continue;
            e2SelectFields.push(key);
        }
        const join: Join =
        {
            e1: entityName, 
            e2: e2, 
            e2Alias: fk.resolvedKeyName, 
            e1JoinField: field,
            e2JoinField: "id", 
            e2SelectFields: e2SelectFields.join(',')
        };
        return join;
    }
}

const joinFactory = new JoinFactory();
export { joinFactory };