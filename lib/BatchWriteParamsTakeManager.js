'use strict';

const AWS_MAX_WRITE_REQUESTS_IN_TAKE = 25;

class BatchWriteParamsTakeManager {
    constructor(params, maxWriteRequestsInTake) {
        this.params = params;

        this.maxWriteRequestsInTake =
            maxWriteRequestsInTake || AWS_MAX_WRITE_REQUESTS_IN_TAKE;

        this.nextWriteRequestIndexLookup = {};
        this.tableNames = Object.getOwnPropertyNames(params.RequestItems);

        this.tableNames.forEach(tableName =>
            this.nextWriteRequestIndexLookup[tableName] = {
                nextWriteRequestIndex: 0,
                totalWriteRequests: params.RequestItems[tableName].length
            }
        );
    }

    getTakeParams() {
        let totalWriteRequestsInTake = 0;
        const result = { RequestItems: {} };

        for (let i = 0; i < this.tableNames.length; ++i) {
            const tableName = this.tableNames[i];
            const nextIndexes = this.nextWriteRequestIndexLookup[tableName];

            if (nextIndexes.nextWriteRequestIndex >= nextIndexes.totalWriteRequests) {
                continue;
            }

            const takeCount = Math.min(
                nextIndexes.totalWriteRequests - nextIndexes.nextWriteRequestIndex,
                this.maxWriteRequestsInTake - totalWriteRequestsInTake);

            result.RequestItems[tableName] = this.params.RequestItems[tableName].slice(
                nextIndexes.nextWriteRequestIndex,
                nextIndexes.nextWriteRequestIndex + takeCount);

            nextIndexes.nextWriteRequestIndex += takeCount;
            totalWriteRequestsInTake += takeCount;

            if (totalWriteRequestsInTake >= this.maxWriteRequestsInTake) {
                break;
            }
        }

        return totalWriteRequestsInTake === 0 ? null : result;
    }
}

module.exports = exports = BatchWriteParamsTakeManager;
