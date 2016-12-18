'use strict';

const AWS = require('aws-sdk');
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

const BATCH_GET_MAX_TAKE = 100;

class BatchGetParamsManager {
    constructor(params) {
        this.params = params;
        this.nextIndexesLookup = {};
        this.tableNames = Object.getOwnPropertyNames(params.RequestItems);

        this.tableNames.forEach(tableName =>
            this.nextIndexesLookup[tableName] = {
                nextIndex: 0,
                length: params.RequestItems[tableName].length
            }
        );
    }

    getTakeParams() {
        let totalItems = 0;
        const result = { RequestItems: {} };

        for (let i = 0; i < this.tableNames.length; ++i) {
            const tableName = this.tableNames[i];
            const nextIndexes = this.nextIndexesLookup[tableName];

            if (nextIndexes.nextIndex >= nextIndexes.length) {
                continue;
            }

            const takeCount = Math.min(
                nextIndexes.length - nextIndexes.nextIndex,
                BATCH_GET_MAX_TAKE);

            result.RequestItems[tableName] = Object.assign(
                {}, this.params.RequestItems[tableName]);

            result.RequestItems[tableName].Keys = this.params.RequestItems[tableName].Keys.slice(
                nextIndexes.nextIndex,
                nextIndexes.nextIndex + takeCount);

            nextIndexes.nextIndex += takeCount;
            totalItems += takeCount;

            if (totalItems >= BATCH_GET_MAX_TAKE) {
                break;
            }
        }

        return totalItems === 0 ? null : result;
    }
}

function batchGetImpl(params) {
    const result = { Responses: {} };

    const tableNames = Object.getOwnPropertyNames(params.RequestItems);
    tableNames.forEach(tableName => result.Responses[tableName] = []);

    const batchTakeManager = new BatchGetParamsManager(params);
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
            const unprocessedKeys = data.UnprocessedKeys[tableName];

            if (unprocessedKeys.length) {
                takeParams.RequestItems[tableName].Keys = unprocessedKeys;
                hasUnprocessedKeys = true;
            } else {
                delete takeParams.RequestItems[tableName];
            }
        });

        if (hasUnprocessedKeys) {
            console.log('getting unprocessed keys', JSON.stringify(takeParams));
            documentClient.batchGet(takeParams).promise().then(resultHandler);
        } else {
            takeParams = batchTakeManager.getTakeParams();

            if (!takeParams) {
                return result;
            } else {
                console.log('getting next keys batch', JSON.stringify(takeParams));
                documentClient.batchGet(takeParams).promise().then(resultHandler);
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

module.exports = {
    batchGet: batchGet,
    batchWrite: null, // TODO
    query: query,
    scan: scan,
    get: params => documentClient.get(params).promise(),
    delete: params => documentClient.delete(params).promise(),
    put: params => documentClient.put(params).promise()
};
