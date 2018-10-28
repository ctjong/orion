"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const execService_1 = require("./execService");
const dataService_1 = require("./dataService");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const https = require("https");
/**
 * A module for handling authentication
 */
class AuthService {
    /**
     * Initialize the user context for the current request.
     * @param ctx Request context
     */
    initUserContext(ctx) {
        const authHeader = ctx.req.get("authorization");
        if (authHeader && ctx.config.auth) {
            try {
                const token = authHeader.replace("Bearer ", "");
                const decoded = jwt.verify(token, ctx.config.auth.secretKey);
                const userInfo = {
                    id: decoded.id,
                    name: decoded.userName,
                    roles: decoded.roles.split(","),
                    domain: decoded.domain,
                    tokenExpiry: parseInt(decoded.expiry)
                };
                const now = new Date().getTime();
                if (isNaN(userInfo.tokenExpiry) || userInfo.tokenExpiry >= now)
                    ctx.user = userInfo;
            }
            catch (e) {
                execService_1.execService.throwError("5192", 401, "invalid token");
            }
        }
        if (ctx.user.roles.length === 0) {
            ctx.user.roles.push("guest");
        }
    }
    /**
     * Try to generate an Orion token for the user with the given credential.
     * Throw an exception if credential is invalid or an error occurs.
     * The access token will be sent into the response object in the context.
     * @param ctx Request context
     * @param userName Submitted user name
     * @param password Submitted password
     */
    generateLocalUserToken(ctx, userName, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this.verifyAuthSupported(ctx);
            if (!userName || !password)
                execService_1.execService.throwError("003a", 400, "invalid login");
            const user = yield dataService_1.dataService.db.quickFind(ctx, ["id", "password", "roles", "domain", "firstname", "lastname"], "user", { "userName": userName });
            if (!user) {
                execService_1.execService.throwError("13c2", 400, "user not found with userName " + userName);
                return;
            }
            if (user.domain !== "local") {
                execService_1.execService.throwError("24a7", 400, "external user login is not supported in this endpoint");
                return;
            }
            const hashedInput = this.hashPassword(ctx, password);
            if (hashedInput !== user.password) {
                execService_1.execService.throwError("003a", 400, "invalid login");
                return;
            }
            this.createAndSendToken(ctx, user.id, "local", "", user.roles, user.firstname, user.lastname);
        });
    }
    /**
     * Try to generate an Orion access token for the user with the given Facebook token.
     * Throw an exception if credential is invalid or an error occurs.
     * The access token will be sent into the response object in the context.
     * @param ctx Request context
     * @param fbToken Facebook token
     */
    processFbToken(ctx, fbToken) {
        this.verifyAuthSupported(ctx);
        const req = https.request({
            host: "graph.facebook.com",
            path: "/v2.2/me?fields=id,first_name,last_name,email&access_token=" + fbToken
        }, (response) => {
            let body = '';
            response.on('data', (data) => {
                execService_1.execService.catchAllErrors(ctx, () => body += data);
            });
            response.on('end', () => __awaiter(this, void 0, void 0, function* () {
                execService_1.execService.catchAllErrors(ctx, () => __awaiter(this, void 0, void 0, function* () {
                    const parsed = JSON.parse(body);
                    if (!parsed.hasOwnProperty("id"))
                        execService_1.execService.throwError("3f9c", 400, "bad request");
                    const readResponse = yield dataService_1.dataService.db.quickFind(ctx, ["id", "roles"], "user", { "domainid": parsed.id });
                    if (readResponse) {
                        this.createAndSendToken(ctx, readResponse.id, "fb", parsed.id, readResponse.roles, parsed.first_name, parsed.last_name);
                        return;
                    }
                    const createResponse = yield dataService_1.dataService.db.insert(ctx, "user", ["domain", "domainid", "roles", "email", "firstname", "lastname", "createdtime"], ["fb", parsed.id, "member", parsed.email, parsed.first_name, parsed.last_name, new Date().getTime()]);
                    const id = createResponse[0].identity.toString();
                    this.createAndSendToken(ctx, id, "fb", parsed.id, ["member"], parsed.first_name, parsed.last_name);
                }));
            }));
        });
        req.end();
    }
    /**
     * Encrypt the given plan text password
     * @param ctx Request context
     * @param plainPassword Plain text password
     * @returns hashed password
     */
    hashPassword(ctx, plainPassword) {
        this.verifyAuthSupported(ctx);
        const hash = crypto.createHmac('sha512', ctx.config.auth.salt);
        hash.update(plainPassword);
        return hash.digest('hex');
    }
    /**
     * Verify authentication is supported in config. Throw exception if not.
     * @param ctx request context
     */
    verifyAuthSupported(ctx) {
        if (!ctx.config.auth)
            execService_1.execService.throwError("94e8", 500, "Authentication is not supported for this site");
    }
    /**
     * Create a token from the given information and send it into the response object.
     * @param ctx Request context
     * @param id User's ID
     * @param domain User's domain
     * @param domainId User's ID on the domain
     * @param roles User's roles
     * @param firstName User's first name
     * @param lastName User's last name
     */
    createAndSendToken(ctx, id, domain, domainId, roles, firstName, lastName) {
        const tokenLifetimeInMins = ctx.config.auth.tokenLifetimeInMins;
        const expiry = tokenLifetimeInMins ? new Date().getTime() + tokenLifetimeInMins * 60000 : Number.MAX_VALUE;
        const tokenPayload = { id: id, domain: domain, domainId: domainId, roles: roles, tokenExpiry: expiry };
        const token = jwt.sign(tokenPayload, ctx.config.auth.secretKey);
        ctx.res.json({ "token": token, "id": id, "firstname": firstName, "lastname": lastName });
    }
}
const authService = new AuthService();
exports.authService = authService;
