# Orion Documentation

- [Home](../)
- [Create Your First Orion Application](create-your-first-orion-application)
- [API Endpoints](api-endpoints)
- [Configuration](configuration)
- [Authentication](authentication)
- [User Roles](user-roles)
- [Condition Syntax](condition-syntax)
- [API Reference](api-reference)

## User Roles

Here is a list of user roles supported by the library. These roles (except admin) are automatically assigned to the requester of each incoming request. A user can have multiple roles (i.e. can be both "member" and "owner").
Role | Description
- | -
guest | Unauthenticated user. Assigned when with no token provided.
member | Authenticated user. Assigned when a valid token is provided.
owner | Owner of the target record. Assigned if the request is a GET in private mode OR if the request is a POST/PUT/DELETE and the target record is owned by the user.
admin | Site administrator. There is no endpoint to assign this to users programmatically, so this needs to be set manually by database admin.