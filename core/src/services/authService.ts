import { Context, UserInfo } from '../types';
import { execService } from './execService';
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import * as https from "https";

/**
 * A module for handling authentication
 */
class AuthService
{
    /**
     * Initialize the user context for the current request.
     * @param ctx Request context
     */
    initUserContext(ctx:Context): void
    {
        const authHeader:string = ctx.req.get("authorization");
        if(authHeader && ctx.config.auth)
        {
            try
            {
                const token:string = authHeader.replace("Bearer ", "");
                const decoded:any = jwt.verify(token, ctx.config.auth.secretKey);
                const userInfo:UserInfo = 
                {
                    id: decoded.id,
                    name: decoded.userName,
                    roles: decoded.roles.split(","),
                    domain: decoded.domain,
                    tokenExpiry: parseInt(decoded.expiry)
                };
                const now:number = new Date().getTime();
                if(isNaN(userInfo.tokenExpiry) || userInfo.tokenExpiry >= now)
                    ctx.user = userInfo;
            }
            catch(e)
            {
                execService.throwError("5192", 401, "invalid token");
            }
        }
        if(!ctx.user || !ctx.user.roles || ctx.user.roles.length === 0)
        {
            ctx.user = new UserInfo();
            ctx.user.tokenExpiry = Number.MAX_VALUE;
            ctx.user.roles = ["guest"];
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
    async generateLocalUserTokenAsync(ctx:Context, userName:string, password:string): Promise<void>
    {
        this.verifyAuthSupported(ctx);
        if(!userName || !password) 
            execService.throwError("003a", 400, "invalid login");
        const user = await ctx.db.quickFindAsync(
            ctx, 
            ["id", "password", "roles", "domain", "firstname", "lastname"], 
            "user", 
            {"userName": userName});

        if(!user) 
        {
            execService.throwError("13c2", 400, "user not found with userName " + userName);
            return;
        }

        if(user.domain !== "local")
        {
            execService.throwError("24a7", 400, "external user login is not supported in this endpoint");
            return;
        }

        const hashedInput = this.hashPassword(ctx, password);
        if(hashedInput !== user.password)
        {
            execService.throwError("003a", 400, "invalid login");
            return;
        }

        this.createAndSendToken(ctx, user.id, "local", "", user.roles, user.firstname, user.lastname);
    }

    /**
     * Try to generate an Orion access token for the user with the given Facebook token.
     * Throw an exception if credential is invalid or an error occurs.
     * The access token will be sent into the response object in the context.
     * @param ctx Request context
     * @param fbToken Facebook token
     */
    processFbTokenAsync(ctx:Context, fbToken:string): Promise<void>
    {
        return new Promise(resolve =>
        {
            this.verifyAuthSupported(ctx);
            const req = https.request(
                {
                    host: "graph.facebook.com", 
                    path: "/v2.2/me?fields=id,first_name,last_name,email&access_token=" + fbToken
                }, 
                (response) =>
                {
                    let body = '';
                    response.on('data', (data:string) => 
                    {
                        execService.catchAllErrorsAsync(ctx, () => body += data);
                    });
                    response.on('end', async () =>
                    {
                        execService.catchAllErrorsAsync(ctx, async () =>
                        {
                            const parsed = JSON.parse(body);
                            if(!parsed.hasOwnProperty("id"))
                                execService.throwError("3f9c", 400, "bad request");

                            const existingUser = await ctx.db.quickFindAsync(ctx, ["id", "roles"], "user", {"domainid": parsed.id});
                            if(existingUser)
                            {
                                this.createAndSendToken(ctx, existingUser.id, "fb", parsed.id, existingUser.roles, parsed.first_name, parsed.last_name);
                            }
                            else
                            {
                                const createResponse = await ctx.db.insertAsync(
                                    ctx,
                                    "user", 
                                    ["domain", "domainid", "roles", "email", "firstname", "lastname"], 
                                    ["fb", parsed.id, "member", parsed.email, parsed.first_name, parsed.last_name]);
                                const id = createResponse[0].identity.toString();
                                this.createAndSendToken(ctx, id, "fb", parsed.id, ["member"], parsed.first_name, parsed.last_name);
                            }

                            resolve();
                        });
                    });
                }
            );
            req.end();
        });
    }

    /**
     * Encrypt the given plan text password
     * @param ctx Request context
     * @param plainPassword Plain text password
     * @returns hashed password
     */
    hashPassword(ctx:Context, plainPassword:string): string
    {
        this.verifyAuthSupported(ctx);
        const hash = crypto.createHmac('sha512', ctx.config.auth.salt);
        hash.update(plainPassword);
        return hash.digest('hex');
    }

    /**
     * Verify authentication is supported in config. Throw exception if not.
     * @param ctx request context
     */
    verifyAuthSupported(ctx:Context): void
    {
        if (!ctx.config.auth)
            execService.throwError("94e8", 500, "Authentication is not supported for this site");
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
    private createAndSendToken(ctx:Context, id:string, domain:string, domainId:string, roles:string[], firstName:string, lastName:string): void
    {
        const tokenLifetimeInMins = ctx.config.auth.tokenLifetimeInMins;
        const expiry = tokenLifetimeInMins ? new Date().getTime() + tokenLifetimeInMins * 60000 : Number.MAX_VALUE;
        const tokenPayload:UserInfo = { id: id, domain: domain, domainId: domainId, roles: roles, tokenExpiry: expiry };
        const token = jwt.sign(tokenPayload, ctx.config.auth.secretKey);
        ctx.res.json({"token": token, "id": id, "firstname": firstName, "lastname": lastName});
    }
}

const authService = new AuthService();
export { authService };