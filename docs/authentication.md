# Orion Documentation

- [Home](../)
- [Create Your First Orion Application](create-your-first-orion-application)
- [API Endpoints](api-endpoints)
- [Configuration Options](configuration-options)
- [Sample Configuration](sample-configuration)
- [Authentication](authentication)
- [User Roles](user-roles)
- [Condition Syntax](condition-syntax)
- [API Reference](api-reference)

## Authentication

The library is using OAuth mechanism to authorize users for accessing certain API resources. This mechanism allows API requests to be executed on behalf of a user using an access token. This token is issued by a certain token provider when the user is logged in / authenticated. The Orion application acts as the token provider in this scenario, and users can request for a token in two ways, by submitting login credentials using the **"POST /api/auth/token"** endpoint, or by submitting a Facebook token using the **"POST /api/auth/token/fb"** endpoint.

After you retrieve the Orion token, you will need to attach it to the header of each API request you make, so typically you would want to store the token in the browser's localStorage/sessionStorage, or in the local app data for mobile apps. The token's lifetime can be controlled in the config (if not specified in the config, the token will be set to never expire). When an expired token is used in a request, it will be treated as if no token is provided, so in most cases a 401 response will be returned and the user will have to log in again.

For Facebook authentication, you need to request for a Facebook token first before exchanging it with Orion token. The way to retrieve the Facebook token depends on the platform of your client app. See [Facebook documentation](https://developers.facebook.com/docs/facebook-login/access-tokens/#usertokens) for more details.