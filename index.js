'use strict';

const AWS = require('aws-sdk');
const BatchGetParamsTakeManager = require('./lib/BatchGetParamsTakeManager');

const documentClient = new AWS.DynamoDB.DocumentClient();

function query(params) {
    return _applyExclusiveStartAction('query', params);
}

function scan(params) {
    return _applyExclusiveStartAction('scan', params);
}

function _applyExclusiveStartAction(action, params) {
    const paramsCopy = Object.assign({}, params);
    const result = [];
    let resultHandler = null;

    resultHandler = data => {
        Array.prototype.push.apply(result, data.Items || []);

        if (data.LastEvaluatedKey) {
            paramsCopy.ExclusiveStartKey = data.LastEvaluatedKey;
            return documentClient[action](paramsCopy).promise().then(resultHandler);
        } else {
            return result;
        }
    };

    return documentClient[action](paramsCopy).promise().then(resultHandler);
}

function batchGetImpl(params) {
    const result = { Responses: {} };

    const tableNames = Object.getOwnPropertyNames(params.RequestItems);
    tableNames.forEach(tableName => result.Responses[tableName] = []);

    const batchTakeManager = new BatchGetParamsTakeManager(params);
    let takeParams = batchTakeManager.getTakeParams();

    let resultHandler = null;

    resultHandler = data => {
        tableNames.forEach(tableName => {
            Array.prototype.push.apply(
                result.Responses[tableName],
                data.Responses[tableName]);
        });

        let hasUnprocessedKeys = false;

        tableNames.forEach(tableName => {
            const unprocessedKeys = data.UnprocessedKeys[tableName] || [];

            if (unprocessedKeys.length) {
                takeParams.RequestItems[tableName].Keys = unprocessedKeys;
                hasUnprocessedKeys = true;
            } else {
                delete takeParams.RequestItems[tableName];
            }
        });

        if (hasUnprocessedKeys) {
            documentClient.batchGet(takeParams).promise().then(resultHandler);
        } else {
            takeParams = batchTakeManager.getTakeParams();

            if (!takeParams) {
                return result;
            } else {
                return documentClient.batchGet(takeParams).promise().then(resultHandler);
            }
        }
    };

    return documentClient.batchGet(takeParams).promise().then(resultHandler);
}

function batchGet(params) {
    const paramsLookup = {};
    const tableNames = Object.getOwnPropertyNames(params.RequestItems);

    tableNames.forEach(tableName => 
        paramsLookup[tableName] = params.RequestItems[tableName].Keys.length
    );

    return batchGetImpl(params)
        .then(result => {
            tableNames.forEach(tableName => {
                const responsesForTable = result.Responses[tableName] || [];

                if (responsesForTable.length !== paramsLookup[tableName]) {
                    throw new Error('[404] Entity Not Found');
                }
            });

            return result;
        });
}

function get(params) {
    return documentClient.get(params).promise()
        .then(data => {
            if (!data.Item) {
                throw new Error('[404] Not Found');
            }

            return data.Item;
        });
}

module.exports = {
    batchGet: batchGet,
    batchWrite: null, // TODO
    query: query,
    scan: scan,
    get: get,
    delete: params => documentClient.delete(params).promise(),
    put: params => documentClient.put(params).promise()
};
