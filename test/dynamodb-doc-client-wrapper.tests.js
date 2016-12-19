'use strict';

const should = require('should');
const sinon = require('sinon');
const documentClient = require('../lib/documentClient');
const clientWrapper = require('../index.js');

describe('dynamodb-doc-client-wrapper', function() {
    describe('batchGet', function() {
        afterEach(function () {
            documentClient.batchGet.restore();
        });

        it('should execute a batchGet where the result is in two takes for one of the tables', function(done) {
            const params = {
                RequestItems: {
                    Table1: {
                        Keys: [{ id: 1 }, { id: 2 }]
                    },
                    Table2: {
                        Keys: [{ id: 3 }, { id: 4 }]
                    }
                }
            };

            let invocationCount = 0;

            sinon.stub(
                documentClient, 'batchGet',
                args => {
                    ++invocationCount;

                    if (invocationCount === 1) {
                        should(args).eql(params);

                        return Promise.resolve({
                            Responses: {
                                Table1: [{ id: 1 }],
                                Table2: [{ id: 3 }, { id: 4 }]
                            },
                            UnprocessedKeys: {
                                Table1: [{ id: 2 }]
                            }
                        });
                    } else if (invocationCount === 2) {
                        should(args).eql({
                            RequestItems: {
                                Table1: {
                                    Keys: [{ id: 2 }]
                                }
                            }
                        });

                        return Promise.resolve({
                            Responses: {
                                Table1: [{ id: 2 }]
                            },
                            UnprocessedKeys: {}
                        });
                    } else {
                        throw new Error(`invocation count out of range: ${invocationCount}`);
                    }
                });

            clientWrapper.batchGet(params)
                .then(items => {
                    should(items).eql({
                        Responses: {
                            Table1: [{ id: 1 }, { id: 2 }],
                            Table2: [{ id: 3 }, { id: 4 }]
                        }
                    });
                    done();
                })
                .catch(err => done(err));
        });

        it('should execute a batchGet where the result is in two takes', function(done) {
            const params = {
                RequestItems: {
                    Table1: {
                        Keys: [{ id: 1 }, { id: 2 }]
                    },
                    Table2: {
                        Keys: [{ id: 3 }, { id: 4 }]
                    }
                }
            };

            let invocationCount = 0;

            sinon.stub(
                documentClient, 'batchGet',
                args => {
                    ++invocationCount;

                    if (invocationCount === 1) {
                        should(args).eql(params);

                        return Promise.resolve({
                            Responses: {
                                Table1: [{ id: 1 }],
                                Table2: [{ id: 4 }]
                            },
                            UnprocessedKeys: {
                                Table1: [{ id: 2 }],
                                Table2: [{ id: 3 }]
                            }
                        });
                    } else if (invocationCount === 2) {
                        should(args).eql({
                            RequestItems: {
                                Table1: {
                                    Keys: [{ id: 2 }]
                                },
                                Table2: {
                                    Keys: [{ id: 3 }]
                                }
                            }
                        });

                        return Promise.resolve({
                            Responses: {
                                Table1: [{ id: 2 }],
                                Table2: [{ id: 3 }]
                            },
                            UnprocessedKeys: {}
                        });
                    } else {
                        throw new Error(`invocation count out of range: ${invocationCount}`);
                    }
                });

            clientWrapper.batchGet(params)
                .then(items => {
                    should(items).eql({
                        Responses: {
                            Table1: [{ id: 1 }, { id: 2 }],
                            Table2: [{ id: 4 }, { id: 3 }]
                        }
                    });
                    done();
                })
                .catch(err => done(err));
        });

        it('should execute a batchGet where the result is in a single take', function(done) {
            const params = {
                RequestItems: {
                    Table1: {
                        Keys: [{ id: 1 }, { id: 2 }]
                    },
                    Table2: {
                        Keys: [{ id: 3 }, { id: 4 }]
                    }
                }
            };

            sinon.stub(
                documentClient, 'batchGet',
                args => {
                    should(args).eql(params);

                    return Promise.resolve({
                        Responses: {
                            Table1: [{ id: 1 }, { id: 2 }],
                            Table2: [{ id: 3 }, { id: 4 }]
                        },
                        UnprocessedKeys: {
                            Table1: [],
                            Table2: []
                        }
                    });
                });

            clientWrapper.batchGet(params)
                .then(items => {
                    should(items).eql({
                        Responses: {
                            Table1: [{ id: 1 }, { id: 2 }],
                            Table2: [{ id: 3 }, { id: 4 }]
                        }
                    });
                    done();
                })
                .catch(err => done(err));
        });

        it('should throw an error when the result does not contain one of the requested items', function(done) {
            const params = {
                RequestItems: {
                    Table1: {
                        Keys: [{ id: 1 }, { id: 2 }]
                    },
                    Table2: {
                        Keys: [{ id: 3 }, { id: 4 }]
                    }
                }
            };

            sinon.stub(
                documentClient, 'batchGet',
                args => {
                    should(args).eql(params);

                    return Promise.resolve({
                        Responses: {
                            Table1: [{ id: 1 }, { id: 2 }],
                            Table2: [{ id: 4 }]
                        },
                        UnprocessedKeys: {
                            Table1: [],
                            Table2: []
                        }
                    });
                });

            clientWrapper.batchGet(params)
                .then(item => {
                    done('should have thrown an exception');
                })
                .catch(err => {
                    if (err.message.indexOf('[404] ') === 0) {
                        done();
                    } else {
                        done(`exception thrown but it had the wrong message: ${err.message}`);
                    }
                });
        });
    });

    describe('scan', function() {
        afterEach(function () {
            documentClient.scan.restore();
        });

        it('should execute a scan where the result is in a single take', function(done) {
            const params = {
                TableName: 'MyTable',
                ConsistentRead: false
            };

            const itemsToReturn = [{ id: 1 }];

            sinon.stub(
                documentClient, 'scan',
                args => {
                    should(args).eql(params);

                    return Promise.resolve({
                        Items: itemsToReturn,
                        LastEvaluatedKey: null
                    });
                });

            clientWrapper.scan(params)
                .then(items => {
                    should(items).eql(itemsToReturn);
                    done();
                })
                .catch(err => done(err));
        });

        it('should execute a scan where the result is in two takes', function(done) {
            const params = {
                TableName: 'MyTable',
                ConsistentRead: false
            };

            const firstTakeItems = [{ id: 1 }];
            const secondTakeItems = [{ id: 2 }];
            let invocationCount = 0;

            sinon.stub(
                documentClient, 'scan',
                args => {
                    ++invocationCount;

                    if (invocationCount === 1) {
                        should(args).eql({
                            TableName: 'MyTable',
                            ConsistentRead: false
                        });

                        return Promise.resolve({
                            Items: firstTakeItems,
                            LastEvaluatedKey: { id: 1 }
                        });
                    } else if (invocationCount === 2) {
                        should(args).eql({
                            TableName: 'MyTable',
                            ConsistentRead: false,
                            ExclusiveStartKey: { id: 1 }
                        });

                        return Promise.resolve({
                            Items: secondTakeItems,
                            LastEvaluatedKey: null
                        });
                    } else {
                        throw new Error('invocation count out of range');
                    }
                });

            clientWrapper.scan(params)
                .then(items => {
                    should(items).eql([{ id: 1 }, { id: 2 }]);
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('query', function() {
        afterEach(function () {
            documentClient.query.restore();
        });

        it('should execute a query where the result is in a single take', function(done) {
            const params = {
                TableName: 'MyTable',
                KeyConditionExpression: 'venueId = :venueId',
                ExpressionAttributeValues: { ':venueId': 111 }
            };

            const itemsToReturn = [{ id: 1 }];

            sinon.stub(
                documentClient, 'query',
                args => {
                    should(args).eql(params);

                    return Promise.resolve({
                        Items: itemsToReturn,
                        LastEvaluatedKey: null
                    });
                });

            clientWrapper.query(params)
                .then(items => {
                    should(items).eql(itemsToReturn);
                    done();
                })
                .catch(err => done(err));
        });

        it('should execute a query where the result is in two takes', function(done) {
            const params = {
                TableName: 'MyTable',
                KeyConditionExpression: 'venueId = :venueId',
                ExpressionAttributeValues: { ':venueId': 111 }
            };

            const firstTakeItems = [{ id: 1 }];
            const secondTakeItems = [{ id: 2 }];
            let invocationCount = 0;

            sinon.stub(
                documentClient, 'query',
                args => {
                    ++invocationCount;

                    if (invocationCount === 1) {
                        should(args).eql({
                            TableName: 'MyTable',
                            KeyConditionExpression: 'venueId = :venueId',
                            ExpressionAttributeValues: { ':venueId': 111 }
                        });

                        return Promise.resolve({
                            Items: firstTakeItems,
                            LastEvaluatedKey: { id: 1 }
                        });
                    } else if (invocationCount === 2) {
                        should(args).eql({
                            TableName: 'MyTable',
                            KeyConditionExpression: 'venueId = :venueId',
                            ExpressionAttributeValues: { ':venueId': 111 },
                            ExclusiveStartKey: { id: 1 }
                        });

                        return Promise.resolve({
                            Items: secondTakeItems,
                            LastEvaluatedKey: null
                        });
                    } else {
                        throw new Error('invocation count out of range');
                    }
                });

            clientWrapper.query(params)
                .then(items => {
                    should(items).eql([{ id: 1 }, { id: 2 }]);
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('delete', function() {
        afterEach(function () {
            documentClient.delete.restore();
        });

        it('should delete an item in the db', function(done) {
            const params = {
                TableName: 'MyTable',
                Index: { id: 1 }
            };

            sinon.stub(
                documentClient, 'delete',
                args => {
                    should(args).eql(params);
                    return Promise.resolve();
                });

            clientWrapper.delete(params)
                .then(item => done())
                .catch(err => done(err));
        });
    });

    describe('put', function() {
        afterEach(function () {
            documentClient.put.restore();
        });

        it('should put an item to the db', function(done) {
            const params = {
                TableName: 'MyTable',
                Item: { foo: 'bar' }
            };

            sinon.stub(
                documentClient, 'put',
                args => {
                    should(args).eql(params);
                    return Promise.resolve();
                });

            clientWrapper.put(params)
                .then(item => done())
                .catch(err => done(err));
        });
    });

    describe('get', function() {
        afterEach(function () {
            documentClient.get.restore();
        });

        it('should get an item from the db', function(done) {
            const params = {
                TableName: 'MyTable',
                Index: { id: 1 }
            };

            sinon.stub(
                documentClient, 'get',
                args => {
                    should(args).eql(params);
                    return Promise.resolve({ Item: { id: 1 } });
                });

            clientWrapper.get(params)
                .then(item => {
                    should(item).eql({ id: 1 });
                    done();
                })
                .catch(err => done(err));
        });

        it('should throw if the item is not in the db', function(done) {
            const params = {
                TableName: 'MyTable',
                Index: { id: 1 }
            };

            sinon.stub(
                documentClient, 'get',
                args => {
                    should(args).eql(params);
                    return Promise.resolve({});
                });

            clientWrapper.get(params)
                .then(item => {
                    done('should have thrown an exception');
                })
                .catch(err => {
                    if (err.message.indexOf('[404] ') === 0) {
                        done();
                    } else {
                        done(`exception thrown but it had the wrong message: ${err.message}`);
                    }
                });
        });
    });
});
