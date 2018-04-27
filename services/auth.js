/**
 * A module for handling authentication
 */
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

        /**
         * Initialize the user context for the current request.
         * @param {any} ctx Request context
         */
        function initUserContext(ctx)
        {
            var authHeader = ctx.req.get("authorization");
            if(!!authHeader && !!ctx.config.auth)
            {
                try
                {
                    var token = authHeader.replace("Bearer ", "");
                    var decoded = _this.jwt.verify(token, ctx.config.auth.secretKey);
                    var expiry = parseInt(decoded.expiry);
                    var now = new Date().getTime();
                    if(isNaN(expiry) || expiry >= now)
                    {
                        ctx.userId = parseInt(decoded.id);
                        ctx.userName = decoded.name;
                        ctx.userRoles = decoded.roles.split(",");
                        ctx.userDomain = decoded.domain;
                    }
                }
                catch(e)
                {
                    throw new _this.exec.Error("5192", 401, "invalid token");
                }
            }
            if(ctx.userRoles.length === 0)
            {
                ctx.userRoles.push("guest");
            }
        }

        /**
         * Try to generate an Orion token for the user with the given credential.
         * Throw an exception if credential is invalid or an error occurs.
         * The access token will be sent into the response object in the context.
         * @param {any} ctx Request context
         * @param {any} userName Submitted user name
         * @param {any} password Submitted password
         */
        function generateLocalUserToken(ctx, userName, password)
        {
            verifyAuthSupported(ctx);
            if(!userName || !password) 
                throw new _this.exec.Error("003a", 400, "invalid login");
            _this.db.quickFind(
                ctx, 
                ["id", "password", "roles", "domain", "firstname", "lastname"], 
                "user", 
                {"userName": userName}, 
                function(user)
                {
                    // verify login
                    if(!user) 
                        throw new _this.exec.Error("13c2", 400, "user not found with userName " + userName);
                    if(user.domain !== "local") throw new _this.exec.Error("24a7", 400, "external user login is not supported in this endpoint");
                    var hashedInput = _this.hashPassword(ctx, password);
                    if(hashedInput !== user.password) throw new _this.exec.Error("003a", 400, "invalid login");
                    // generate token
                    createAndSendToken(ctx, user.id, "local", "", user.roles, user.firstname, user.lastname);
                }
            );
        }

        /**
         * Try to generate an Orion access token for the user with the given Facebook token.
         * Throw an exception if credential is invalid or an error occurs.
         * The access token will be sent into the response object in the context.
         * @param {any} ctx Request context
         * @param {any} fbToken Facebook token
         */
        function processFbToken(ctx, fbToken) 
        {
            verifyAuthSupported(ctx);
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
                            throw new _this.exec.Error("3f9c", 400, "bad request");
                        _this.db.quickFind(ctx, ["id", "roles"], "user", {"domainid": parsed.id}, function(readResponse)
                        {
                            if(!readResponse) 
                            {
                                _this.db.insert(
                                    ctx,
                                    "user", 
                                    ["domain", "domainid", "roles", "email", "firstname", "lastname", "createdtime"], 
                                    ["fb", parsed.id, "member", parsed.email, parsed.first_name, parsed.last_name, new Date().getTime()], 
                                    function(createResponse)
                                    {
                                        var id = createResponse[0].identity.toString();
                                        createAndSendToken(ctx, id, "fb", parsed.id, "member", parsed.first_name, parsed.last_name);
                                    }
                                );
                            }
                            else
                            {
                                createAndSendToken(ctx, readResponse.id, "fb", parsed.id, readResponse.roles, parsed.first_name, parsed.last_name);
                            }
                        });
                    });
                }
            );
            req.end();
        }

        /**
         * Encrypt the given plan text password
         * @param {any} ctx Request context
         * @param {any} plainPassword Plain text password
         */
        function hashPassword(ctx, plainPassword)
        {
            verifyAuthSupported(ctx);
            var hash = _this.crypto.createHmac('sha512', ctx.config.auth.salt);
            hash.update(plainPassword);
            return hash.digest('hex');
        }

        /**
         * Verify authentication is supported in config. Throw exception if not.
         */
        function verifyAuthSupported(ctx)
        {
            if (!ctx.config.auth)
                throw new _this.exec.Error("94e8", 500, "Authentication is not supported for this site");
        }

        //----------------------------------------------
        // PRIVATE
        //----------------------------------------------

        /**
         * Create a token from the given information and send it into the response object.
         * @param {any} ctx Request context
         * @param {any} id User's ID
         * @param {any} domain User's domain
         * @param {any} domainId User's ID on the domain
         * @param {any} roles User's roles
         * @param {any} firstName User's first name
         * @param {any} lastName User's last name
         */
        function createAndSendToken(ctx, id, domain, domainId, roles, firstName, lastName)
        {
            var tokenPayload = { id: id, domain: domain, domainId: domainId, roles: roles };
            var tokenLifetimeInMins = ctx.config.auth.tokenLifetimeInMins;
            if(!!tokenLifetimeInMins)
                tokenPayload.expiry = new Date().getTime() + tokenLifetimeInMins * 60000;
            var token = _this.jwt.sign(tokenPayload, ctx.config.auth.secretKey);
            ctx.res.json({"token": token, "id": id, "firstname": firstName, "lastname": lastName});
        }

        this.initUserContext = initUserContext;
        this.generateLocalUserToken = generateLocalUserToken;
        this.processFbToken = processFbToken;
        this.hashPassword = hashPassword;
        this.verifyAuthSupported = verifyAuthSupported;
        _construct();
    }
};