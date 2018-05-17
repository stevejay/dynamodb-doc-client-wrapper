'use strict';

const documentClientFactory = require('./lib/documentClientFactory');
const BatchGetParamsTakeManager = require('./lib/BatchGetParamsTakeManager');
const BatchWriteParamsTakeManager = require('./lib/BatchWriteParamsTakeManager');

function query(params, documentClient) {
    return _applyExclusiveStartAction('query', params, documentClient);
}

function scan(params, documentClient) {
    return _applyExclusiveStartAction('scan', params, documentClient);
}

function _applyExclusiveStartAction(action, params, documentClient) {
    const paramsCopy = Object.assign({}, params);
    const result = [];
    let clientResultHandler = null;

    clientResultHandler = data => {
        Array.prototype.push.apply(result, data.Items || []);

        if (data.LastEvaluatedKey) {
            paramsCopy.ExclusiveStartKey = data.LastEvaluatedKey;
            return documentClient[action](paramsCopy).then(clientResultHandler);
        } else {
            return result;
        }
    };

    return documentClient[action](paramsCopy).then(clientResultHandler);
}

function batchGetImpl(params, documentClient) {
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
            const unprocessedKeys = 
                data.UnprocessedKeys ?
                data.UnprocessedKeys[tableName] || [] :
                [];

            if (unprocessedKeys.length) {
                takeParams.RequestItems[tableName].Keys = unprocessedKeys;
                hasUnprocessedKeys = true;
            } else {
                delete takeParams.RequestItems[tableName];
            }
        });

        if (hasUnprocessedKeys) {
            return documentClient.batchGet(takeParams).then(resultHandler);
        } else {
            takeParams = batchTakeManager.getTakeParams();

            if (!takeParams) {
                return result;
            } else {
                return documentClient.batchGet(takeParams).then(resultHandler);
            }
        }
    };

    return documentClient.batchGet(takeParams).then(resultHandler);
}

function batchGet(params, documentClient, notFoundMsg) {
    const paramsLookup = {};
    const tableNames = Object.getOwnPropertyNames(params.RequestItems);

    tableNames.forEach(tableName => 
        paramsLookup[tableName] = params.RequestItems[tableName].Keys.length
    );

    return batchGetImpl(params, documentClient)
        .then(result => {
            tableNames.forEach(tableName => {
                const responsesForTable = result.Responses[tableName] || [];

                if (responsesForTable.length !== paramsLookup[tableName]) {
                    throw new Error(notFoundMsg);
                }
            });

            return result;
        });
}

function batchWrite(params, documentClient) {
    const tableNames = Object.getOwnPropertyNames(params.RequestItems);
    const batchTakeManager = new BatchWriteParamsTakeManager(params);
    let takeParams = batchTakeManager.getTakeParams();

    let resultHandler = null;

    resultHandler = data => {
        let hasUnprocessedItems = false;

        tableNames.forEach(tableName => {
            const unprocessedItems = 
                data.UnprocessedItems ?
                data.UnprocessedItems[tableName] || [] :
                [];

            if (unprocessedItems.length) {
                takeParams.RequestItems[tableName] = unprocessedItems;
                hasUnprocessedItems = true;
            } else {
                delete takeParams.RequestItems[tableName];
            }
        });

        if (hasUnprocessedItems) {
            return documentClient.batchWrite(takeParams).then(resultHandler);
        } else {
            takeParams = batchTakeManager.getTakeParams();

            if (!takeParams) {
                return;
            } else {
                return documentClient.batchWrite(takeParams).then(resultHandler);
            }
        }
    };

    return documentClient.batchWrite(takeParams).then(resultHandler);
}

function get(params, documentClient, notFoundMsg) {
    return documentClient.get(params)
        .then(data => {
            if (!data.Item) {
                throw new Error(notFoundMsg);
            }

            return data.Item;
        });
}

function tryGet(params, documentClient) {
    return documentClient.get(params)
        .then(data => data.Item || null);
}

module.exports = exports = function (options) {
    options = options || {}
    const documentClient = documentClientFactory(options.dynamodb || null)
    const notFoundMsg = options.notFoundMsg || '[404] Entity Not Found'
    const module = {
        batchGet: params => batchGet(params, documentClient, notFoundMsg),
        batchGetBasic: params => documentClient.batchGet(params),
        query: params => query(params, documentClient),
        queryBasic: params => documentClient.query(params),
        scan: params => scan(params, documentClient),
        scanBasic: params => documentClient.scan(params),
        get: params => get(params, documentClient, notFoundMsg),
        tryGet: params => tryGet(params, documentClient),
        getBasic: params => documentClient.get(params),
        delete: params => documentClient.delete(params),
        put: params => documentClient.put(params),
        batchWrite: params => batchWrite(params, documentClient),
        batchWriteBasic: params => documentClient.batchWrite(params),
        update: params => documentClient.update(params)
    };
}
