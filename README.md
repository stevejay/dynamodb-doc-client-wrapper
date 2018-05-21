# dynamodb-doc-client-wrapper

A wrapper around the AWS DynamoDB DocumentClient class that handles
building complete result sets from the `query`, `scan` and `batchGet`
methods, returning the results as Promises.

[![npm version](https://badge.fury.io/js/dynamodb-doc-client-wrapper.svg)](https://badge.fury.io/js/dynamodb-doc-client-wrapper)
[![Codeship Status for stevejay/dynamodb-doc-client-wrapper](https://app.codeship.com/projects/d832c8d0-a77d-0134-c8f7-7eca77d71521/status?branch=master)](https://app.codeship.com/projects/191146)
[![Coverage Status](https://coveralls.io/repos/github/stevejay/dynamodb-doc-client-wrapper/badge.svg?branch=master)](https://coveralls.io/github/stevejay/dynamodb-doc-client-wrapper?branch=master)
[![bitHound Overall Score](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/badges/score.svg)](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper)
[![bitHound Dependencies](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/badges/dependencies.svg)](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/master/dependencies/npm)
[![bitHound Dev Dependencies](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/badges/devDependencies.svg)](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/master/dependencies/npm)

[![NPM](https://nodei.co/npm/dynamodb-doc-client-wrapper.png)](https://nodei.co/npm/dynamodb-doc-client-wrapper/)

**Note: See the instructions [here](CHANGELOG.md) for migrating from Version 1 to Version 2 of this library.**

## Installation

```
$ npm install --save dynamodb-doc-client-wrapper
```

or

```
$ yarn add dynamodb-doc-client-wrapper
```

You also need to have the `aws-sdk` package available as a peer dependency. When running AWS Lambda functions on AWS, that package is already installed; you can install `aws-sdk` as a dev dependency so it is available locally when testing.

## Usage

You should create one client wrapper instance in a file that you then require as needed elsewhere in your service. If you do not need to configure the wrapper, you can create this basic file...

```js
const clientWrapper = require("dynamodb-doc-client-wrapper");
module.exports = clientWrapper();
```

... and then require it wherever like so:

```js
const dynamodbClient = require('./path/to/the/file/above')

// later in a function in this file...
const response = await dynamodbClient.query({
    TableName: 'MyTable',
    KeyConditionExpression: 'tagType = :tagType',
    ExpressionAttributeValues: { ':tagType': 'audience' },
    ProjectionExpression: 'id, label'
});
```

Sometimes you need to configure the wrapper. One reason would be if you are using Dynamodb with the [serverless](https://serverless.com/) framework and the [serverless-offline](https://github.com/dherault/serverless-offline) plugin. You can achieve this like so:

```js
const clientWrapper = require("dynamodb-doc-client-wrapper");

const config = process.env.IS_OFFLINE
  ? {
      connection: {
        region: "localhost",
        endpoint: "http://localhost:8000"
      }
    }
  : null;

module.exports = clientWrapper(config);
```

Note: in the above example, `process.env.IS_OFFLINE` gets set by the [serverless-offline](https://github.com/dherault/serverless-offline) plugin.

Alternatively you can use [serverless-dynamodb-client](https://github.com/99xt/serverless-dynamodb-client), which creates a properly configured `DocumentClient` instance. You can create and use that instance like so:

```js
const dynamodb = require("serverless-dynamodb-client");

const dynamodbClient = require("dynamodb-doc-client-wrapper")({
  documentClient: dynamodb.doc
});

module.exports = dynamodbClient;
```

### Configuration Options

All config options are optional. The allowed options are:

| Name           | Description                                                                                                                                                                                               | Default Value            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| connection     | An [AWS.DynamoDB.DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property) config object. Ignored if the `documentClient` option exists. | n/a                      |
| documentClient | Your own preconfigured [AWS.DynamoDB.DocumentClient](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property) instance.                                 | n/a                      |
| notFoundMsg    | The message of the error thrown when a `get` or `batchGet` request returns a 404 response.                                                                                                                | '[404] Entity Not Found' |

## API

### Query

```js
const response = await clientWrapper.query({
    TableName: 'MyTable',
    KeyConditionExpression: 'tagType = :tagType',
    ExpressionAttributeValues: { ':tagType': 'audience' },
    ProjectionExpression: 'id, label'
});

// response is a list of db items.
```

The response will have all matching items, even if the query
had to be done in multiple takes because of the limit
on total response size in DynamoDB.

### QueryBasic

```js
const response = await clientWrapper.queryBasic({
    TableName: 'MyTable',
    KeyConditionExpression: 'tagType = :tagType',
    ExpressionAttributeValues: { ':tagType': 'audience' },
    ProjectionExpression: 'id, label'
});

// response is the raw DynamoDB client response
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.query` method, for when
you want access to the entire response object and
you will manage getting all the results yourself.

### Scan

```js
const response = await clientWrapper.scan({
    TableName: 'MyTable',
    ProjectionExpression: 'id, label'
});

// response is a list of db items.
```

The response will have all matching items, even if the scan
had to be done in multiple takes because of the limit
on total response size in DynamoDB.

### ScanBasic

```js
const response = await clientWrapper.scanBasic({
    TableName: 'MyTable',
    ProjectionExpression: 'id, label'
});

// response is the raw DynamoDB client response
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.scan` method, for when
you want access to the entire response object and
you will manage getting all the results yourself.

### BatchGet

```js
const response = await clientWrapper.batchGet({
    RequestItems: {
        'Table1': {
            Keys: [{ id: 1 }, { id: 2 }]
        },
        'Table2': {
            Keys: [{ id: 3 }, { id: 4 }]
        }
    }
});

// response is an object with the results for each table in it, e.g.:
//
// {
//     Responses: {
//         'Table1': [
//             { id: 1, name: 'a' },
//             { id: 2, name: 'b' }
//         ],
//         'Table2': [
//             { id: 3, name: 'c' },
//             { id: 4, name: 'd' }
//         ]
//     }
// }
```

All items will be retrieved, even if the number of items to be retrieved
exceeds the DynamoDB limit of 100 items, or if the limit
on total response size in DynamoDB was exceeded.

An exception is thrown if any requested db item was not found. The
exception message by default is '[404] Entity Not Found'.

### BatchGetBasic

```js
const response = await clientWrapper.batchGetBasic({
    RequestItems: {
        'Table1': {
            Keys: [{ id: 1 }, { id: 2 }]
        }
    }
});

// response is the raw DynamoDB client response
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.batchGet` method, for when
you want access to the entire response object and
you will manage getting all the results yourself.

### Get

```js
const response = await clientWrapper.get({
    TableName: 'MyTable',
    Index: { id: 1 }
});

// response is the item, e.g. { id: 1, name: 'a' }
```

An exception is thrown if the requested db item was not found. The
exception message by default is '[404] Entity Not Found'.

### TryGet

```js
const response = await clientWrapper.tryGet({
    TableName: 'MyTable',
    Index: { id: 1 }
});

// response is the item, e.g. { id: 1, name: 'a' },
// or null if the item does not exist in the db.
```

If the requested db item was not found then `null` is returned.

### GetBasic

```js
const response = await clientWrapper.getBasic({
    TableName: 'MyTable',
    Index: { id: 1 }
});

// response is the raw response, e.g., { Item: { id: 1, name: 'a' } }
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.get` method, for when
you want access to the entire response object.

### Put

```js
await clientWrapper.put({
    TableName: 'MyTable',
    Item: { id: 1, name: 'a' }
});
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.put` method.

### BatchWrite

```js
await clientWrapper.batchWrite({
    RequestItems: {
        'Table1': [
            { DeleteRequest: { Key: { id: 1 } } }
        ]
    }
})
```

This method ultimately invokes the
`AWS.DynamoDB.DocumentClient.batchWrite` method,
but it takes care of batching up the writes so that
a single request does not exceed the DynamoDB limits,
and it resubmits unprocessed writes.

### BatchWriteBasic

```js
await clientWrapper.batchWriteBasic({
    RequestItems: {
        'Table1': [
            { DeleteRequest: { Key: { id: 1 } } }
        ]
    }
})
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.batchWrite` method.

### Update

```js
await clientWrapper.update({
    TableName: 'Table',
    Key: { HashKey : 'hashkey' },
    UpdateExpression: 'set #a = :x + :y',
});
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.update` method.

### Delete

```js
await clientWrapper.delete({
    TableName: 'MyTable',
    Index: { id: 1 }
});
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.delete` method.

## License

[MIT](LICENSE)
