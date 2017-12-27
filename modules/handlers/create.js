module.exports = 
{
    dependencies: ["auth", "helper", "db"],
    Instance: function()
    {
        var _this = this;

        //----------------------------------------------
        // CONSTRUCTOR
        //----------------------------------------------

        function _construct(){}

        //----------------------------------------------
        // PUBLIC
        //----------------------------------------------

        this.execute = function(ctx, requestBody)
        {
            _this.helper.validate(ctx, "create", _this.db, null, requestBody, function(resource, requestBody)
            {
                // get required and optional fields
                var fields = getConfigFields(ctx);
                var requiredFields = fields.required;
                var optionalFields = fields.optional;

                // validate requirements
                validateRequirements(ctx, requestBody, requiredFields);

                // prepare field names and values for query
                fields = prepareFields(ctx, requestBody, requiredFields, optionalFields);
                var fieldNames = fields.names;
                var fieldValues = fields.values;

                // execute query
                if(ctx.entity === "user")
                {
                    verifyUsernameNotExist(ctx, requestBody.username, function()
                    {
                        _this.db.insert(ctx, ctx.entity, fieldNames, fieldValues, function(dbResponse)
                        {
                            if(ctx.config.emailVerificationRequired)
                            {
                                //TODO email verification
                            }
                            ctx.res.send(dbResponse[0].identity.toString());
                        });
                    });
                }
                else
                {
                    _this.db.insert(ctx, ctx.entity, fieldNames, fieldValues, function(dbResponse)
                    {
                        ctx.res.send(dbResponse[0].identity.toString());
                    });
                }
            });
        };

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        function getConfigFields(ctx)
        {
            var allFields = ctx.config.entities[ctx.entity].fields;
            var requiredFields = [];
            var optionalFields = [];
            for(var fieldName in allFields)
            {
                if(!allFields.hasOwnProperty(fieldName))
                    continue;
                var createReq = allFields[fieldName].createReq;
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

        function validateRequirements(ctx, requestBody, requiredFields)
        {
            if(ctx.config.captchaEnabled)
            {
                //TODO validate captcha
            }
            for(i=0; i<requiredFields.length; i++)
            {
                var requiredField = requiredFields[i];
                if(!requestBody.hasOwnProperty(requiredField) || !requestBody[requiredField])
                {
                    throw new _this.error.Error("86c5", 400, "missing required field " + requiredFields[i]);
                }
            }
            if(ctx.entity === "user") 
            {
                if(requestBody.password !== requestBody.confirmpassword)
                {
                    throw new _this.error.Error("1b9e", 400, "password doesn't match the confirmation");
                }
                validateEmail(requestBody.email);
                verifyPwdRequirements(requestBody.password, ctx.config.passwordReqs);
                requestBody.password = _this.auth.hashPassword(ctx, requestBody.password);
            }
        }

        function prepareFields(ctx, requestBody, requiredFields, optionalFields)
        {
            var i;
            var fieldNames = [];
            var fieldValues = [];
            for(i=0; i<requiredFields.length; i++)
            {
                fieldNames.push(requiredFields[i]);
                fieldValues.push(requestBody[requiredFields[i]]);
            }
            for(i=0; i<optionalFields.length; i++)
            {
                fieldNames.push(optionalFields[i]);
                fieldValues.push(requestBody[optionalFields[i]]);
            }
            if(ctx.entity === "user")
            {
                fieldNames.push("roles");
                fieldValues.push(ctx.config.defaultRole);
                fieldNames.push("domain");
                fieldValues.push("local");
            }
            else
            {
                fieldNames.push("ownerid");
                fieldValues.push(ctx.userId);
            }
            fieldNames.push("createdtime");
            fieldValues.push(new Date().getTime());
            return { names: fieldNames, values: fieldValues };
        }

        /*
            Validate the given email
        */
        function validateEmail(email) 
        {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(!re.test(email))
            {
                throw new _this.error.Error("dbaa", 400, "email is not valid: " + email);
            }
        }

        /*
            Verify if the given password meet the requirement
        */
        function verifyPwdRequirements(newPassword, passwordReqs)
        {
            if(newPassword.length < passwordReqs.minLength)
            {
                throw new _this.error.Error("ef60", 400, "password must be at least " + passwordReqs.minLength + " characters long");
            }
            if (passwordReqs.lowercaseChar && !newPassword.match(/[a-z]/))
            {
                throw new _this.error.Error("8c5e", 400, "password must contain at least one lowercase character.");
            }
            if(passwordReqs.uppercaseChar && !newPassword.match(/[A-Z]/))
            {
                throw new _this.error.Error("d625", 400, "password must contain at least one uppercase character.");
            }
            if (passwordReqs.digitChar && !newPassword.match(/[0-9]/))
            {
                throw new _this.error.Error("6db6", 400, "password must contain at least one numeric character.");
            }
            if (passwordReqs.specialChar && !newPassword.match(/[!#$%&()*+,-./:;<=>?@[\]^_`{|}~]/))
            {
                throw new _this.error.Error("8b26", 400, "password must contain at least one special character (!#$%&()*+,-./:;<=>?@[\]^_`{|}~).");
            }
        }

        /*
            Throw error if the given username already exists in the database
        */
        function verifyUsernameNotExist(ctx, username, callback)
        {
            _this.db.quickFind(ctx, ["username"], "user", {"username": username}, function(resource)
            {
                if(!!resource) throw "username " + username + " already exists";
                callback();
            });
        }

        _construct();
    }
};