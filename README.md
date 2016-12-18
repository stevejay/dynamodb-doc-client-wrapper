# dynamodb-doc-client-wrapper

For building complete result sets from the AWS DynamoDB API DocumentClient class

[![npm version](https://badge.fury.io/js/dynamodb-doc-client-wrapper.svg)](https://badge.fury.io/js/dynamodb-doc-client-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/stevejay/dynamodb-doc-client-wrapper/badge.svg?branch=master)](https://coveralls.io/github/stevejay/dynamodb-doc-client-wrapper?branch=master)
[![dependency status](https://david-dm.org/stevejay/dynamodb-doc-client-wrapper.svg)](https://david-dm.org/stevejay/dynamodb-doc-client-wrapper)

## Install

```
$ npm install --save dynamodb-doc-client-wrapper
```

## Usage

```js
const clientWrapper = require('dynamodb-doc-client-wrapper');

const response = yield clientWrapper.query({
    TableName: 'MyTable',
    KeyConditionExpression: 'tagType = :tagType',
    ExpressionAttributeValues: { ':tagType': 'audience' },
    ProjectionExpression: 'id, label'
});
```

## License

MIT
