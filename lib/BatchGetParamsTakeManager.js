'use strict';

const AWS_MAX_KEYS_TAKE = 100;

class BatchGetParamsTakeManager {
    constructor(params, maxKeysInTake) {
        this.params = params;
        this.maxKeysInTake = maxKeysInTake || AWS_MAX_KEYS_TAKE;
        this.nextKeyIndexLookup = {};
        this.tableNames = Object.getOwnPropertyNames(params.RequestItems);

        this.tableNames.forEach(tableName =>
            this.nextKeyIndexLookup[tableName] = {
                nextKeyIndex: 0,
                totalKeyCount: params.RequestItems[tableName].Keys.length
            }
        );
    }

    getTakeParams() {
        let totalKeysInTake = 0;
        const result = { RequestItems: {} };

        for (let i = 0; i < this.tableNames.length; ++i) {
            const tableName = this.tableNames[i];
            const nextIndexes = this.nextKeyIndexLookup[tableName];

            if (nextIndexes.nextKeyIndex >= nextIndexes.totalKeyCount) {
                continue;
            }

            const takeCount = Math.min(
                nextIndexes.totalKeyCount - nextIndexes.nextKeyIndex,
                this.maxKeysInTake - totalKeysInTake);

            result.RequestItems[tableName] = Object.assign(
                {}, this.params.RequestItems[tableName]);

            result.RequestItems[tableName].Keys = this.params.RequestItems[tableName].Keys.slice(
                nextIndexes.nextKeyIndex,
                nextIndexes.nextKeyIndex + takeCount);

            nextIndexes.nextKeyIndex += takeCount;
            totalKeysInTake += takeCount;

            if (totalKeysInTake >= this.maxKeysInTake) {
                break;
            }
        }

        return totalKeysInTake === 0 ? null : result;
    }
}

module.exports = BatchGetParamsTakeManager;
