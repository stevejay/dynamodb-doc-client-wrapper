'use strict';

const should = require('should');
const sinon = require('sinon');
const documentClient = require('../lib/documentClient');
const clientWrapper = require('../index.js');

describe('dynamodb-doc-client-wrapper', function() {
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
                    return Promise.resolve({ Item: null });
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
