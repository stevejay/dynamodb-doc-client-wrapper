# dynamodb-doc-client-wrapper

A wrapper around the AWS DynamoDB DocumentClient class that handles
building complete result sets from the `query`, `scan` and `batchGet`
methods.

[![npm version](https://badge.fury.io/js/dynamodb-doc-client-wrapper.svg)](https://badge.fury.io/js/dynamodb-doc-client-wrapper)
[![Codeship Status for stevejay/dynamodb-doc-client-wrapper](https://app.codeship.com/projects/d832c8d0-a77d-0134-c8f7-7eca77d71521/status?branch=master)](https://app.codeship.com/projects/191146)
[![Coverage Status](https://coveralls.io/repos/github/stevejay/dynamodb-doc-client-wrapper/badge.svg?branch=master)](https://coveralls.io/github/stevejay/dynamodb-doc-client-wrapper?branch=master)
[![bitHound Overall Score](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/badges/score.svg)](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper)
[![bitHound Dependencies](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/badges/dependencies.svg)](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/master/dependencies/npm)
[![bitHound Dev Dependencies](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/badges/devDependencies.svg)](https://www.bithound.io/github/stevejay/dynamodb-doc-client-wrapper/master/dependencies/npm)

[![NPM](https://nodei.co/npm/dynamodb-doc-client-wrapper.png)](https://nodei.co/npm/dynamodb-doc-client-wrapper/)

## Install

```
$ npm install --save dynamodb-doc-client-wrapper
```

You also need to have the `aws-sdk` package available. When running 
AWS Lambda functions on AWS, that package is already installed; you 
can install it as a dev dependency so it is available locally when
testing.

## Usage

### Query

```js
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.query({
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
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.queryBasic({
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
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.scan({
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
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.scanBasic({
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
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.batchGet({
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
exception message is '[404] Entity Not Found'.

### BatchGetBasic

```js
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.batchGetBasic({
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
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.get({
    TableName: 'MyTable',
    Index: { id: 1 }
});

// response is the item, e.g. { id: 1, name: 'a' }
```

An exception is thrown if the requested db item was not found. The 
exception message is '[404] Entity Not Found'.

### GetBasic

```js
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.getBasic({
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
const clientWrapper = require('dynamodb-doc-client-wrapper');

yield clientWrapper.put({
    TableName: 'MyTable',
    Item: { id: 1, name: 'a' }
});
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.put` method.

### Delete

```js
const clientWrapper = require('dynamodb-doc-client-wrapper');

yield clientWrapper.delete({
    TableName: 'MyTable',
    Index: { id: 1 }
});
```

This is a simple pass-through wrapper around the
`AWS.DynamoDB.DocumentClient.delete` method.

## License

MIT
