## Changelog

### 2.0.1

Added link in README file to Version 2 migration instructions.

### 2.0.0

You are now able to pass configuration options to the library. Notably, you are able to pass options to the [AWS.DynamoDB.DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property) constructor, for example if you want to run against a [Dynamodb Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) instance while developing. Allowing options to be passed means that the wrapper has to be configured before use. Previously you could just use the wrapper directly:

```js
// old way:
const clientWrapper = require("dynamodb-doc-client-wrapper");
// clientWrapper was then good to go
```

Now it is a factory function and so needs to be invoked before use. This means that you will almost certainly want to add a file that creates an instance of the wrapper, configured how you see fit, and that then exports the configured instance. You would then require this file wherever in your service you need to access Dynamodb:

```js
// new way:
const clientWrapper = require("dynamodb-doc-client-wrapper");
module.exports = clientWrapper(); // <-- can now pass config options here
```
