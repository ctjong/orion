module.exports = 
{
    dependencies: ["jwt", "db", "crypto", "condition", "https"],
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

        this.initUserContext = function(ctx)
        {
            var authHeader = ctx.req.get("authorization");
            if(!!authHeader)
            {
                try
                {
                    var token = authHeader.replace("Bearer ", "");
                    var decoded = _this.jwt.verify(token, ctx.config.secretKey);
                    ctx.userId = parseInt(decoded.id);
                    ctx.userName = decoded.name;
                    ctx.userRoles = decoded.roles.split(",");
                    ctx.userDomain = decoded.domain;
                }
                catch(e)
                {
                    throw new _this.error.Error("5192", 401, "invalid token");
                }
            }
            if(ctx.userRoles.length === 0)
            {
                ctx.userRoles.push("guest");
            }
        }

        this.generateLocalUserToken = function(ctx, userName, password)
        {
            if(!userName || !password) 
                throw new _this.error.Error("003a", 400, "invalid login");
            _this.db.quickFind(
                ctx, 
                ["id", "password", "roles", "domain", "firstname", "lastname"], 
                "user", 
                {"userName": userName}, 
                function(user)
                {
                    // verify login
                    if(!user) 
                        throw new _this.error.Error("13c2", 400, "user not found with userName " + userName);
                    if(user["domain"] !== "local") throw new _this.error.Error("24a7", 400, "external user login is not supported in this endpoint");
                    var hashedInput = _this.hashPassword(ctx, password);
                    if(hashedInput !== user["password"]) throw new _this.error.Error("003a", 400, "invalid login");
                    // generate token
                    createAndSendToken(ctx, user["id"], "local", "", user["roles"], user["firstname"], user["lastname"]);
                }
            );
        };

        this.processFbToken = function(ctx, fbToken) 
        {
            var req = _this.https.request(
                {
                    host: "graph.facebook.com", 
                    path: "/v2.2/me?fields=id,first_name,last_name,email&access_token=" + fbToken
                }, 
                function(response)
                {
                    var body = '';
                    response.on('data', function(d) 
                    {
                        body += d;
                    });
                    response.on('end', function() 
                    {
                        var parsed = JSON.parse(body);
                        if(!parsed.hasOwnProperty("id"))
                            throw new _this.error.Error("3f9c", 400, "bad request");
                        _this.db.quickFind(ctx, ["id", "roles"], "user", {"domainid": parsed["id"]}, function(readResponse)
                        {
                            if(!readResponse) 
                            {
                                _this.db.insert(
                                    ctx,
                                    "user", 
                                    ["domain", "domainid", "roles", "email", "firstname", "lastname", "createdtime"], 
                                    ["fb", parsed["id"], ctx.config.defaultRole, parsed["email"], parsed["first_name"], parsed["last_name"], new Date().getTime()], 
                                    function(createResponse)
                                    {
                                        var id = createResponse[0].identity.toString();
                                        createAndSendToken(ctx, id, "fb", parsed["id"], ctx.config.defaultRole, parsed["first_name"], parsed["last_name"]);
                                    }
                                );
                            }
                            else
                            {
                                createAndSendToken(ctx, readResponse["id"], "fb", parsed["id"], readResponse["roles"], parsed["first_name"], parsed["last_name"]);
                            }
                        });
                    });
                }
            );
            req.end();
        };

        this.hashPassword = function(ctx, plainPassword)
        {
            var hash = _this.crypto.createHmac('sha512', ctx.config.salt);
            hash.update(plainPassword);
            return hash.digest('hex');
        };

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        function createAndSendToken(ctx, id, domain, domainId, roles, firstName, lastName)
        {
            var tokenPayload = { id: id, domain: domain, domainId: domainId, roles: roles };
            var token = _this.jwt.sign(tokenPayload, ctx.config.secretKey);
            ctx.res.json({"token": token, "id": id, "firstname": firstName, "lastname": lastName});
        }

        _construct();
    }
};