'use strict';

const AWS = require('aws-sdk');

module.exports = exports = function (config) {
    const documentClient = new AWS.DynamoDB.DocumentClient(config);

    return {
        batchGet: params => documentClient.batchGet(params).promise(),
        query: params => documentClient.query(params).promise(),
        scan: params => documentClient.scan(params).promise(),
        get: params => documentClient.get(params).promise(),
        delete: params => documentClient.delete(params).promise(),
        put: params => documentClient.put(params).promise(),
        batchWrite: params => documentClient.batchWrite(params).promise(),
        update: params => documentClient.update(params).promise()
    }
};
