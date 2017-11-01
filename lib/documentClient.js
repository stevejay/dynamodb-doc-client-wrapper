'use strict';


const AWS = require('aws-sdk');

var documentClient = new AWS.DynamoDB.DocumentClient();

function createDocClient(db_options) {
    documentClient = new AWS.DynamoDB.DocumentClient(db_options);

}

module.exports = exports = {
    createDocClient: createDocClient,
    batchGet: params => documentClient.batchGet(params).promise(),
    query: params => documentClient.query(params).promise(),
    scan: params => documentClient.scan(params).promise(),
    get: params => documentClient.get(params).promise(),
    delete: params => documentClient.delete(params).promise(),
    put: params => documentClient.put(params).promise(),
    batchWrite: params => documentClient.batchWrite(params).promise(),
    update: params => documentClient.update(params).promise()
};
