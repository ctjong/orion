import { helperService } from "../services/helperService";
import { Context, NameValueMap } from "../types";
import { dataService } from "../services/dataService";
import { execService } from "../services/execService";
import { authService } from "../services/authService";

/**
 * Class that handles create operations
 */
class CreateHandler
{
    /**
     * Handle a create record request
     * @param ctx Request context
     * @param requestBody Request body
     */
    async execute (ctx:Context, requestBody:any): Promise<void>
    {
        const dbAdapter = dataService.getDatabaseAdapter();
        await helperService.onBeginWriteRequest(ctx, "create", dbAdapter, null, requestBody);

        // get required and optional fields
        let configFields:{[key:string]:string[]} = this.getConfigFields(ctx);
        const requiredFields:string[] = configFields.required;
        const optionalFields:string[] = configFields.optional;

        // validate requirements
        this.validateRequirements(ctx, requestBody, requiredFields);

        // prepare field names and values for query
        const requestFields:{[key:string]:string[]} = this.prepareFields(ctx, requestBody, requiredFields, optionalFields);
        const fieldNames:string[] = requestFields.names;
        const fieldValues:string[] = requestFields.values;

        // execute query
        if(ctx.entity === "user")
        {
            await this.verifyUsernameNotExist(ctx, requestBody.username);
            const insertedId = await dbAdapter.insert(ctx, ctx.entity, fieldNames, fieldValues);
            ctx.res.send(insertedId.toString());
        }
        else
        {
            const insertedId = await dbAdapter.insert(ctx, ctx.entity, fieldNames, fieldValues);
            try
            {
                ctx.res.send(insertedId.toString());
            } 
            catch(ex) {}
        }
    }

    /**
     * Get a list of fields from the config
     * @param ctx Request context
     * @returns an object containing an array of required fields and an array of optional fields
     */
    private getConfigFields (ctx:Context): any
    {
        const allFields = ctx.config.entities[ctx.entity].fields;
        const requiredFields = [];
        const optionalFields = [];
        for(const fieldName in allFields)
        {
            if(!allFields.hasOwnProperty(fieldName))
                continue;
            const createReq = allFields[fieldName].createReq;
            if(createReq === 1)
            {
                optionalFields.push(fieldName);
            }
            else if(createReq === 2)
            {
                requiredFields.push(fieldName);
            }
        }
        return { required: requiredFields, optional: optionalFields };
    }

    /**
     * Verify that all the requirements for a create operation are met
     * @param ctx Request context
     * @param requestBody Request body
     * @param requiredFields Required fields from config
     */
    validateRequirements(ctx:Context, requestBody:NameValueMap, requiredFields:string[]): void
    {
        for(let i=0; i<requiredFields.length; i++)
        {
            const requiredField = requiredFields[i];
            if(!requestBody.hasOwnProperty(requiredField) || !requestBody[requiredField])
            {
                execService.throwError("86c5", 400, "missing required field " + requiredFields[i]);
            }
        }
        if(ctx.entity === "user") 
        {
            authService.verifyAuthSupported(ctx);
            if(requestBody.password !== requestBody.confirmpassword)
            {
                execService.throwError("1b9e", 400, "password doesn't match the confirmation");
            }
            this.validateEmail(requestBody.email);
            this.verifyPwdRequirements(requestBody.password, ctx.config.auth.passwordReqs);
            requestBody.password = authService.hashPassword(ctx, requestBody.password);
        }
    }

    /**
     * Prepare a list of fields to be included in the create request
     * @param ctx Request context
     * @param requestBody Request body
     * @param requiredFields A list of required fields from config
     * @param optionalFields A list of optional fields from config
     * @returns an object containing an array of field names and an array of field values
     */
    private prepareFields(ctx:Context, requestBody:NameValueMap, requiredFields:string[], optionalFields:string[]): {[key:string]:string[]}
    {
        const fieldNames:string[] = [];
        const fieldValues:any[] = [];
        for(let i=0; i<requiredFields.length; i++)
        {
            fieldNames.push(requiredFields[i]);
            fieldValues.push(requestBody[requiredFields[i]]);
        }
        for(let i=0; i<optionalFields.length; i++)
        {
            fieldNames.push(optionalFields[i]);
            fieldValues.push(requestBody[optionalFields[i]]);
        }
        if(ctx.entity === "user")
        {
            fieldNames.push("roles");
            fieldValues.push("member");
            fieldNames.push("domain");
            fieldValues.push("local");
        }
        else
        {
            fieldNames.push("ownerid");
            fieldValues.push(ctx.user.id);
        }
        fieldNames.push("createdtime");
        fieldValues.push(new Date().getTime());
        return { names: fieldNames, values: fieldValues };
    }

    /**
     * Validate the given email
     * @param email Email string
     */
    private validateEmail(email:string): void
    {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(email))
        {
            execService.throwError("dbaa", 400, "email is not valid: " + email);
        }
    }

    /**
     * Verify that the given password meets the requirement
     * @param newPassword New password
     * @param passwordReqs Password requirements
     */
    private verifyPwdRequirements(newPassword:string, passwordReqs:NameValueMap): void
    {
        if(newPassword.length < passwordReqs.minLength)
        {
            execService.throwError("ef60", 400, "password must be at least " + passwordReqs.minLength + " characters long");
        }
        if (passwordReqs.lowercaseChar && !newPassword.match(/[a-z]/))
        {
            execService.throwError("8c5e", 400, "password must contain at least one lowercase character.");
        }
        if(passwordReqs.uppercaseChar && !newPassword.match(/[A-Z]/))
        {
            execService.throwError("d625", 400, "password must contain at least one uppercase character.");
        }
        if (passwordReqs.digitChar && !newPassword.match(/[0-9]/))
        {
            execService.throwError("6db6", 400, "password must contain at least one numeric character.");
        }
        if (passwordReqs.specialChar && !newPassword.match(/[!#$%&()*+,-./:;<=>?@[\]^_`{|}~]/))
        {
            execService.throwError("8b26", 400, "password must contain at least one special character (!#$%&()*+,-./:;<=>?@[\]^_`{|}~).");
        }
    }

    /**
     * Verify the given username doesn't exist in the database yet
     * @param ctx Request context
     * @param username Input username
     * @param callback Callback function
     */
    private async verifyUsernameNotExist(ctx:Context, username:string): Promise<void>
    {
        const record = await dataService.getDatabaseAdapter().quickFind(ctx, ["username"], "user", {"username": username});
        if (record)
            throw "username " + username + " already exists";
    }
}

const createHandler = new CreateHandler();
export { createHandler };