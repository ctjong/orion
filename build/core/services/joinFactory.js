"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JoinFactory {
    /**
     * Create a Join object for resolving a foreign key
     * @param ctx Request context
     * @param entity Requested entity
     * @param field Foreign key field
     * @returns Join object
     */
    createForForeignKey(ctx, entity, field) {
        if (!entity || !field)
            throw "[createForForeignKey] Missing entity/field";
        if (!ctx.config.entities[entity])
            throw "[createForForeignKey] invalid entity";
        if (!ctx.config.entities[entity].fields[field])
            throw "[createForForeignKey] invalid field";
        const fk = ctx.config.entities[entity].fields[field].foreignKey;
        const e2 = fk.foreignEntity;
        const e2SelectFields = [];
        const e2SelectFieldObjs = ctx.config.entities[e2].fields;
        for (const key in e2SelectFieldObjs) {
            if (!e2SelectFieldObjs.hasOwnProperty(key))
                continue;
            if (e2SelectFieldObjs[key].type === "secret")
                continue;
            e2SelectFields.push(key);
        }
        const join = {
            e1: entity,
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
exports.joinFactory = joinFactory;
