# Orion Documentation

- [Home](https://ctjong.github.io/orion)
- [Create Your First Orion Application](https://ctjong.github.io/orion/docs/create-your-first-orion-application)
- [API Endpoints](https://ctjong.github.io/orion/docs/api-endpoints)
- [Configuration](https://ctjong.github.io/orion/docs/configuration)
- [Authentication](https://ctjong.github.io/orion/docs/authentication)
- [User Roles](https://ctjong.github.io/orion/docs/user-roles)
- [Condition Syntax](https://ctjong.github.io/orion/docs/condition-syntax)
- [API Reference](https://ctjong.github.io/orion/docs/api-reference)

## Condition Syntax

The condition can be written in this format "{fieldName}{comparison-operator}{fieldValue}". Multiple conditions can also be joined to create a compound condition string "{condition1}{logical-operator}{condition2}".

Operators:
- **Comparison operators**: "&sim;", "<>", "<=", ">=", "<", ">", "=".
    The "&sim;" operator can be used for string/text fields, to match strings with a certain substring in it. The other operators can be used for int/float/timestamp fields.
- **Logical operators**: "&" (and), "|" (or)

**Note:** if you want to include the condition string in a URL, it will have to be URL-encoded. This can be done using the "encodeURIComponent()" method in Javascript, or similar method in other languages.