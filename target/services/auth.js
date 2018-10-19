// const Module = require("../module");
// /**
//  * A module for handling authentication
//  */
// module.exports = class AuthService extends Module
// {
//     /**
//      * Get a list of dependency names for this module
//      */
//     getDependencyNames()
//     {
//         return ["jwt", "db", "crypto", "conditionFactory", "https"];
//     }
//     /**
//      * Initialize the user context for the current request.
//      * @param {any} ctx Request context
//      */
//     initUserContext(ctx)
//     {
//         const authHeader = ctx.req.get("authorization");
//         if(!!authHeader && !!ctx.config.auth)
//         {
//             try
//             {
//                 const token = authHeader.replace("Bearer ", "");
//                 const decoded = this.jwt.verify(token, ctx.config.auth.secretKey);
//                 const expiry = parseInt(decoded.expiry);
//                 const now = new Date().getTime();
//                 if(isNaN(expiry) || expiry >= now)
//                 {
//                     ctx.userId = parseInt(decoded.id);
//                     ctx.userName = decoded.name;
//                     ctx.userRoles = decoded.roles.split(",");
//                     ctx.userDomain = decoded.domain;
//                 }
//             }
//             catch(e)
//             {
//                 this.exec.throwError("5192", 401, "invalid token");
//             }
//         }
//         if(ctx.userRoles.length === 0)
//         {
//             ctx.userRoles.push("guest");
//         }
//     }
//     /**
//      * Try to generate an Orion token for the user with the given credential.
//      * Throw an exception if credential is invalid or an error occurs.
//      * The access token will be sent into the response object in the context.
//      * @param {any} ctx Request context
//      * @param {any} userName Submitted user name
//      * @param {any} password Submitted password
//      */
//     generateLocalUserToken(ctx, userName, password)
//     {
//         this.verifyAuthSupported(ctx);
//         if(!userName || !password) 
//             this.exec.throwError("003a", 400, "invalid login");
//         this.db.quickFind(
//             ctx, 
//             ["id", "password", "roles", "domain", "firstname", "lastname"], 
//             "user", 
//             {"userName": userName}, 
//             (user) =>
//             {
//                 // verify login
//                 if(!user) 
//                     this.exec.throwError("13c2", 400, "user not found with userName " + userName);
//                 if(user.domain !== "local") this.exec.throwError("24a7", 400, "external user login is not supported in this endpoint");
//                 const hashedInput = this.this.hashPassword(ctx, password);
//                 if(hashedInput !== user.password) this.exec.throwError("003a", 400, "invalid login");
//                 // generate token
//                 createAndSendToken(ctx, user.id, "local", "", user.roles, user.firstname, user.lastname);
//             }
//         );
//     }
//     /**
//      * Try to generate an Orion access token for the user with the given Facebook token.
//      * Throw an exception if credential is invalid or an error occurs.
//      * The access token will be sent into the response object in the context.
//      * @param {any} ctx Request context
//      * @param {any} fbToken Facebook token
//      */
//     processFbToken(ctx, fbToken) 
//     {
//         this.verifyAuthSupported(ctx);
//         const req = this.https.request(
//             {
//                 host: "graph.facebook.com", 
//                 path: "/v2.2/me?fields=id,first_name,last_name,email&access_token=" + fbToken
//             }, 
//             (response) =>
//             {
//                 const body = '';
//                 response.on('data', this.exec.cb(ctx, (d) => 
//                 {
//                     body += d;
//                 }));
//                 response.on('end', this.exec.cb(ctx, function() 
//                 {
//                     const parsed = JSON.parse(body);
//                     if(!parsed.hasOwnProperty("id"))
//                         this.exec.throwError("3f9c", 400, "bad request");
//                     this.db.quickFind(ctx, ["id", "roles"], "user", {"domainid": parsed.id}, (readResponse) =>
//                     {
//                         if(!readResponse) 
//                         {
//                             this.db.insert(
//                                 ctx,
//                                 "user", 
//                                 ["domain", "domainid", "roles", "email", "firstname", "lastname", "createdtime"], 
//                                 ["fb", parsed.id, "member", parsed.email, parsed.first_name, parsed.last_name, new Date().getTime()], 
//                                 (createResponse) =>
//                                 {
//                                     const id = createResponse[0].identity.toString();
//                                     createAndSendToken(ctx, id, "fb", parsed.id, "member", parsed.first_name, parsed.last_name);
//                                 }
//                             );
//                         }
//                         else
//                         {
//                             createAndSendToken(ctx, readResponse.id, "fb", parsed.id, readResponse.roles, parsed.first_name, parsed.last_name);
//                         }
//                     });
//                 }));
//             }
//         );
//         req.end();
//     }
//     /**
//      * Encrypt the given plan text password
//      * @param {any} ctx Request context
//      * @param {any} plainPassword Plain text password
//      */
//     hashPassword(ctx, plainPassword)
//     {
//         this.verifyAuthSupported(ctx);
//         const hash = this.crypto.createHmac('sha512', ctx.config.auth.salt);
//         hash.update(plainPassword);
//         return hash.digest('hex');
//     }
//     /**
//      * Verify authentication is supported in config. Throw exception if not.
//      */
//     verifyAuthSupported(ctx)
//     {
//         if (!ctx.config.auth)
//             this.exec.throwError("94e8", 500, "Authentication is not supported for this site");
//     }
// }
// //----------------------------------------------
// // PRIVATE
// //----------------------------------------------
// /**
//  * Create a token from the given information and send it into the response object.
//  * @param {any} ctx Request context
//  * @param {any} id User's ID
//  * @param {any} domain User's domain
//  * @param {any} domainId User's ID on the domain
//  * @param {any} roles User's roles
//  * @param {any} firstName User's first name
//  * @param {any} lastName User's last name
//  */
// const createAndSendToken = (ctx, id, domain, domainId, roles, firstName, lastName) =>
// {
//     const tokenPayload = { id: id, domain: domain, domainId: domainId, roles: roles };
//     const tokenLifetimeInMins = ctx.config.auth.tokenLifetimeInMins;
//     if(!!tokenLifetimeInMins)
//         tokenPayload.expiry = new Date().getTime() + tokenLifetimeInMins * 60000;
//     const token = this.jwt.sign(tokenPayload, ctx.config.auth.secretKey);
//     ctx.res.json({"token": token, "id": id, "firstname": firstName, "lastname": lastName});
// }
