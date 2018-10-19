// const Module = require("../module");
// /**
//  * A module for representing entity joins
//  */
// module.exports = class JoinFactory extends Module 
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return [];
//     }
//     /**
//      * Create a Join object for resolving a foreign key
//      * @param {any} ctx Request context
//      * @param {any} entity Requseted entity
//      * @param {any} field Foreign key field
//      * @returns Join object
//      */
//     createForForeignKey(ctx, entity, field)
//     {
//         if(!entity || !field) throw "[createForForeignKey] Missing entity/field";
//         if(!ctx.config.entities[entity])
//         {
//             throw "[createForForeignKey] invalid entity";
//         }
//         if(!ctx.config.entities[entity].fields[field])
//         {
//             throw "[createForForeignKey] invalid field";
//         }
//         const fk = ctx.config.entities[entity].fields[field].foreignKey;
//         const e2 = fk.foreignEntity;
//         const e2SelectFields = [];
//         const e2SelectFieldObjs = ctx.config.entities[e2].fields;
//         for(const key in e2SelectFieldObjs)
//         {
//             if(!e2SelectFieldObjs.hasOwnProperty(key))
//                 continue;
//             if(e2SelectFieldObjs[key].type === "secret")
//                 continue;
//             e2SelectFields.push(key);
//         }
//         return new Join(entity, e2, fk.resolvedKeyName, field, "id", e2SelectFields);
//     }
// };
// /**
//  * Class representing a join
//  */
// class Join
// {
//     /**
//      * Construct a new Join object
//      * @param {any} e1 First entity
//      * @param {any} e2 Second entity
//      * @param {any} e2Alias Alias of the second entity
//      * @param {any} e1JoinField Field from first entity to join upon
//      * @param {any} e2JoinField Field from second entity to join upon
//      * @param {any} e2SelectFields Fields from second entity to retrieve
//      */
//     constructor(e1, e2, e2Alias, e1JoinField, e2JoinField, e2SelectFields) 
//     {
//         this.e1 = e1;
//         this.e2 = e2;
//         this.e2Alias = e2Alias;
//         this.e1JoinField = e1JoinField;
//         this.e2JoinField = e2JoinField;
//         this.e2SelectFields = e2SelectFields;
//     }
// }
