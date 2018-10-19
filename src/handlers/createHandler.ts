// const Module = require("../module");

// /**
//  * A module to handle create operations
//  */
// module.exports = class CreateHandler
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["auth", "helper", "db"];
//     }

//     /**
//      * Handle a create record request
//      * @param {any} ctx Request context
//      * @param {any} requestBody Request body
//      */
//     execute (ctx, requestBody)
//     {
//         this.helper.onBeginWriteRequest(ctx, "create", this.db, null, requestBody, (record, requestBody) =>
//         {
//             // get required and optional fields
//             let fields = getConfigFields.call(this, ctx);
//             const requiredFields = fields.required;
//             const optionalFields = fields.optional;

//             // validate requirements
//             validateRequirements.call(this, ctx, requestBody, requiredFields);

//             // prepare field names and values for query
//             fields = prepareFields.call(this, ctx, requestBody, requiredFields, optionalFields);
//             const fieldNames = fields.names;
//             const fieldValues = fields.values;

//             // execute query
//             if(ctx.entity === "user")
//             {
//                 verifyUsernameNotExist.call(this, ctx, requestBody.username, function()
//                 {
//                     this.db.insert(ctx, ctx.entity, fieldNames, fieldValues, (insertedId) =>
//                     {
//                         ctx.res.send(insertedId.toString());
//                     });
//                 });
//             }
//             else
//             {
//                 this.db.insert(ctx, ctx.entity, fieldNames, fieldValues, (insertedId) =>
//                 {
//                     try
//                     {
//                         ctx.res.send(insertedId.toString());
//                     } catch(ex) {}
//                 });
//             }
//         });
//     }
// }

// /**
//  * Get a list of fields from the config
//  * @param {any} ctx Request context
//  * @returns an object containing an array of required fields and an array of optional fields
//  */
// const getConfigFields = (ctx) =>
// {
//     const allFields = ctx.config.entities[ctx.entity].fields;
//     const requiredFields = [];
//     const optionalFields = [];
//     for(const fieldName in allFields)
//     {
//         if(!allFields.hasOwnProperty(fieldName))
//             continue;
//         const createReq = allFields[fieldName].createReq;
//         if(createReq === 1)
//         {
//             optionalFields.push(fieldName);
//         }
//         else if(createReq === 2)
//         {
//             requiredFields.push(fieldName);
//         }
//     }
//     return { required: requiredFields, optional: optionalFields };
// }

// /**
//  * Verify that all the requirements for a create operation are met
//  * @param {any} ctx Request context
//  * @param {any} requestBody Request body
//  * @param {any} requiredFields Required fields from config
//  */
// const validateRequirements = (ctx, requestBody, requiredFields) =>
// {
//     for(let i=0; i<requiredFields.length; i++)
//     {
//         const requiredField = requiredFields[i];
//         if(!requestBody.hasOwnProperty(requiredField) || !requestBody[requiredField])
//         {
//             this.exec.throwError("86c5", 400, "missing required field " + requiredFields[i]);
//         }
//     }
//     if(ctx.entity === "user") 
//     {
//         this.auth.verifyAuthSupported(ctx);
//         if(requestBody.password !== requestBody.confirmpassword)
//         {
//             this.exec.throwError("1b9e", 400, "password doesn't match the confirmation");
//         }
//         validateEmail.call(this, requestBody.email);
//         verifyPwdRequirements.call(this, requestBody.password, ctx.config.auth.passwordReqs);
//         requestBody.password = this.auth.hashPassword(ctx, requestBody.password);
//     }
// }

// /**
//  * Prepare a list of fields to be included in the create request
//  * @param {any} ctx Request context
//  * @param {any} requestBody Request body
//  * @param {any} requiredFields A list of required fields from config
//  * @param {any} optionalFields A list of optional fields from config
//  * @returns an object containing an array of field names and an array of field values
//  */
// const prepareFields = (ctx, requestBody, requiredFields, optionalFields) =>
// {
//     const fieldNames = [];
//     const fieldValues = [];
//     for(let i=0; i<requiredFields.length; i++)
//     {
//         fieldNames.push(requiredFields[i]);
//         fieldValues.push(requestBody[requiredFields[i]]);
//     }
//     for(let i=0; i<optionalFields.length; i++)
//     {
//         fieldNames.push(optionalFields[i]);
//         fieldValues.push(requestBody[optionalFields[i]]);
//     }
//     if(ctx.entity === "user")
//     {
//         fieldNames.push("roles");
//         fieldValues.push("member");
//         fieldNames.push("domain");
//         fieldValues.push("local");
//     }
//     else
//     {
//         fieldNames.push("ownerid");
//         fieldValues.push(ctx.userId);
//     }
//     fieldNames.push("createdtime");
//     fieldValues.push(new Date().getTime());
//     return { names: fieldNames, values: fieldValues };
// }

// /**
//  * Validate the given email
//  * @param {any} email Email string
//  */
// const validateEmail = (email) =>
// {
//     const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     if(!re.test(email))
//     {
//         this.exec.throwError("dbaa", 400, "email is not valid: " + email);
//     }
// }

// /**
//  * Verify that the given password meets the requirement
//  * @param {any} newPassword New password
//  * @param {any} passwordReqs Password requirements
//  */
// const verifyPwdRequirements = (newPassword, passwordReqs) =>
// {
//     if(newPassword.length < passwordReqs.minLength)
//     {
//         this.exec.throwError("ef60", 400, "password must be at least " + passwordReqs.minLength + " characters long");
//     }
//     if (passwordReqs.lowercaseChar && !newPassword.match(/[a-z]/))
//     {
//         this.exec.throwError("8c5e", 400, "password must contain at least one lowercase character.");
//     }
//     if(passwordReqs.uppercaseChar && !newPassword.match(/[A-Z]/))
//     {
//         this.exec.throwError("d625", 400, "password must contain at least one uppercase character.");
//     }
//     if (passwordReqs.digitChar && !newPassword.match(/[0-9]/))
//     {
//         this.exec.throwError("6db6", 400, "password must contain at least one numeric character.");
//     }
//     if (passwordReqs.specialChar && !newPassword.match(/[!#$%&()*+,-./:;<=>?@[\]^_`{|}~]/))
//     {
//         this.exec.throwError("8b26", 400, "password must contain at least one special character (!#$%&()*+,-./:;<=>?@[\]^_`{|}~).");
//     }
// }

// /**
//  * Verify the given username doesn't exist in the database yet
//  * @param {any} ctx Request context
//  * @param {any} username Input username
//  * @param {any} callback Callback function
//  */
// const verifyUsernameNotExist = (ctx, username, callback) =>
// {
//     this.db.quickFind(ctx, ["username"], "user", {"username": username}, (record) =>
//     {
//         if(!!record) throw "username " + username + " already exists";
//         callback();
//     });
// }