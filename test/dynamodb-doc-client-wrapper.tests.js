"use strict";

const should = require("should");
const sinon = require("sinon");
const range = require("lodash.range");
const documentClientFactory = require("../lib/documentClientFactory");
const clientWrapper = require("../index.js");

describe("dynamodb-doc-client-wrapper", function() {
  let documentClient = null;

  beforeEach(function() {
    documentClient = {};
    sinon.replace(
      documentClientFactory,
      "create",
      sinon.fake.returns(documentClient)
    );
  });

  afterEach(function() {
    sinon.restore();
  });

  describe("batchGet", function() {
    it("should execute a batchGet where the result is in two takes for one of the tables", function(done) {
      const subject = clientWrapper();

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

      documentClient.batchGet = sinon.fake(args => {
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

      subject
        .batchGet(params)
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

    it("should execute a batchGet where there are too many entities to get in one take", function(done) {
      const subject = clientWrapper();

      const params = {
        RequestItems: {
          Table1: {
            Keys: range(1, 103).map(x => ({ id: x }))
          },
          Table2: {
            Keys: [{ id: 103 }, { id: 104 }]
          }
        }
      };

      let invocationCount = 0;

      documentClient.batchGet = sinon.fake(args => {
        ++invocationCount;

        if (invocationCount === 1) {
          should(args).eql({
            RequestItems: {
              Table1: {
                Keys: range(1, 101).map(x => ({ id: x }))
              }
            }
          });

          return Promise.resolve({
            Responses: {
              Table1: range(1, 101).map(x => ({ id: x }))
            }
          });
        } else if (invocationCount === 2) {
          should(args).eql({
            RequestItems: {
              Table1: {
                Keys: [{ id: 101 }, { id: 102 }]
              },
              Table2: {
                Keys: [{ id: 103 }, { id: 104 }]
              }
            }
          });

          return Promise.resolve({
            Responses: {
              Table1: [{ id: 101 }, { id: 102 }],
              Table2: [{ id: 103 }, { id: 104 }]
            }
          });
        } else {
          throw new Error(`invocation count out of range: ${invocationCount}`);
        }
      });

      subject
        .batchGet(params)
        .then(items => {
          should(items).eql({
            Responses: {
              Table1: range(1, 103).map(x => ({ id: x })),
              Table2: [{ id: 103 }, { id: 104 }]
            }
          });
          done();
        })
        .catch(err => done(err));
    });

    it("should execute a batchGet where the result is in two takes", function(done) {
      const subject = clientWrapper();

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

      documentClient.batchGet = sinon.fake(args => {
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

      subject
        .batchGet(params)
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

    it("should execute a batchGet where the result is in a single take", function(done) {
      const subject = clientWrapper();

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

      documentClient.batchGet = sinon.fake(args => {
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

      subject
        .batchGet(params)
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

    it("should throw an error when the result does not contain one of the requested items", function(done) {
      const subject = clientWrapper();

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

      documentClient.batchGet = sinon.fake(args => {
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

      subject
        .batchGet(params)
        .then(() => {
          done("should have thrown an exception");
        })
        .catch(err => {
          if (err.message.indexOf("[404] ") === 0) {
            done();
          } else {
            done(
              `exception thrown but it had the wrong message: ${err.message}`
            );
          }
        });
    });
  });

  describe("batchGetBasic", function() {
    it("should execute a batchGet where the result is in two takes for one of the tables", function(done) {
      const subject = clientWrapper();

      const params = {
        RequestItems: {
          Table1: {
            Keys: [{ id: 1 }]
          }
        }
      };

      documentClient.batchGet = sinon.fake(args => {
        should(args).eql(params);

        return Promise.resolve({
          Responses: {
            Table1: [{ id: 1 }]
          },
          UnprocessedKeys: {}
        });
      });

      subject
        .batchGetBasic(params)
        .then(response => {
          should(response).eql({
            Responses: {
              Table1: [{ id: 1 }]
            },
            UnprocessedKeys: {}
          });
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("scan", function() {
    it("should execute a scan where the result is in a single take", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        ConsistentRead: false
      };

      const itemsToReturn = [{ id: 1 }];

      documentClient.scan = sinon.fake(args => {
        should(args).eql(params);

        return Promise.resolve({
          Items: itemsToReturn,
          LastEvaluatedKey: null
        });
      });

      subject
        .scan(params)
        .then(items => {
          should(items).eql(itemsToReturn);
          done();
        })
        .catch(err => done(err));
    });

    it("should execute a scan where the result is in two takes", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        ConsistentRead: false
      };

      const firstTakeItems = [{ id: 1 }];
      const secondTakeItems = [{ id: 2 }];
      let invocationCount = 0;

      documentClient.scan = sinon.fake(args => {
        ++invocationCount;

        if (invocationCount === 1) {
          should(args).eql({
            TableName: "MyTable",
            ConsistentRead: false
          });

          return Promise.resolve({
            Items: firstTakeItems,
            LastEvaluatedKey: { id: 1 }
          });
        } else if (invocationCount === 2) {
          should(args).eql({
            TableName: "MyTable",
            ConsistentRead: false,
            ExclusiveStartKey: { id: 1 }
          });

          return Promise.resolve({
            Items: secondTakeItems,
            LastEvaluatedKey: null
          });
        } else {
          throw new Error("invocation count out of range");
        }
      });

      subject
        .scan(params)
        .then(items => {
          should(items).eql([{ id: 1 }, { id: 2 }]);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("scanBasic", function() {
    it("should scan the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        ConsistentRead: false,
        ExclusiveStartKey: null
      };

      documentClient.scan = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({ Items: [{ id: 1 }] });
      });

      subject
        .scanBasic(params)
        .then(response => {
          should(response).eql({ Items: [{ id: 1 }] });
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("query", function() {
    it("should execute a query where the result is in a single take", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        KeyConditionExpression: "venueId = :venueId",
        ExpressionAttributeValues: { ":venueId": 111 }
      };

      const itemsToReturn = [{ id: 1 }];

      documentClient.query = sinon.fake(args => {
        should(args).eql(params);

        return Promise.resolve({
          Items: itemsToReturn,
          LastEvaluatedKey: null
        });
      });

      subject
        .query(params)
        .then(items => {
          should(items).eql(itemsToReturn);
          done();
        })
        .catch(err => done(err));
    });

    it("should execute a query where the result is in two takes", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        KeyConditionExpression: "venueId = :venueId",
        ExpressionAttributeValues: { ":venueId": 111 }
      };

      const firstTakeItems = [{ id: 1 }];
      const secondTakeItems = [{ id: 2 }];
      let invocationCount = 0;

      documentClient.query = sinon.fake(args => {
        ++invocationCount;

        if (invocationCount === 1) {
          should(args).eql({
            TableName: "MyTable",
            KeyConditionExpression: "venueId = :venueId",
            ExpressionAttributeValues: { ":venueId": 111 }
          });

          return Promise.resolve({
            Items: firstTakeItems,
            LastEvaluatedKey: { id: 1 }
          });
        } else if (invocationCount === 2) {
          should(args).eql({
            TableName: "MyTable",
            KeyConditionExpression: "venueId = :venueId",
            ExpressionAttributeValues: { ":venueId": 111 },
            ExclusiveStartKey: { id: 1 }
          });

          return Promise.resolve({
            Items: secondTakeItems,
            LastEvaluatedKey: null
          });
        } else {
          throw new Error("invocation count out of range");
        }
      });

      subject
        .query(params)
        .then(items => {
          should(items).eql([{ id: 1 }, { id: 2 }]);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("queryBasic", function() {
    it("should query the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        KeyConditionExpression: "venueId = :venueId",
        ExpressionAttributeValues: { ":venueId": 111 },
        ExclusiveStartKey: null
      };

      documentClient.query = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({ Items: [{ id: 1 }] });
      });

      subject
        .queryBasic(params)
        .then(response => {
          should(response).eql({ Items: [{ id: 1 }] });
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("delete", function() {
    it("should delete an item in the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Index: { id: 1 }
      };

      documentClient.delete = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve();
      });

      subject
        .delete(params)
        .then(() => done())
        .catch(err => done(err));
    });
  });

  describe("put", function() {
    it("should put an item to the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Item: { foo: "bar" }
      };

      documentClient.put = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve();
      });

      subject
        .put(params)
        .then(() => done())
        .catch(err => done(err));
    });
  });

  describe("get", function() {
    it("should get an item from the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Index: { id: 1 }
      };

      documentClient.get = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({ Item: { id: 1 } });
      });

      subject
        .get(params)
        .then(item => {
          should(item).eql({ id: 1 });
          done();
        })
        .catch(err => done(err));
    });

    it("should throw if the item is not in the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Index: { id: 1 }
      };

      documentClient.get = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({});
      });

      subject
        .get(params)
        .then(() => {
          done("should have thrown an exception");
        })
        .catch(err => {
          if (err.message.indexOf("[404] ") === 0) {
            done();
          } else {
            done(
              `exception thrown but it had the wrong message: ${err.message}`
            );
          }
        });
    });
  });

  describe("tryGet", function() {
    it("should get an item from the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Index: { id: 1 }
      };

      documentClient.get = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({ Item: { id: 1 } });
      });

      subject
        .tryGet(params)
        .then(item => {
          should(item).eql({ id: 1 });
          done();
        })
        .catch(err => done(err));
    });

    it("should return null if the item is not in the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Index: { id: 1 }
      };

      documentClient.get = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({});
      });

      subject
        .tryGet(params)
        .then(item => {
          should(item).eql(null);
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("getBasic", function() {
    it("should get an item from the db", function(done) {
      const subject = clientWrapper();

      const params = {
        TableName: "MyTable",
        Index: { id: 1 }
      };

      documentClient.get = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({ Item: { id: 1 } });
      });

      subject
        .getBasic(params)
        .then(response => {
          should(response).eql({ Item: { id: 1 } });
          done();
        })
        .catch(err => done(err));
    });
  });

  describe("batchWrite", function() {
    it("should submit write batch to the db", function(done) {
      const subject = clientWrapper();

      const params = {
        RequestItems: {
          MyTable: [{ DeleteRequest: { Key: { id: 1 } } }]
        }
      };

      documentClient.batchWrite = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve({});
      });

      subject
        .batchWrite(params)
        .then(() => done())
        .catch(err => done(err));
    });
  });

  describe("batchWriteBasic", function() {
    it("should submit write batch to the db", function(done) {
      const subject = clientWrapper();

      const params = {
        RequestItems: {
          MyTable: [{ DeleteRequest: { Key: { id: 1 } } }]
        }
      };

      documentClient.batchWrite = sinon.fake(args => {
        should(args).eql(params);
        return Promise.resolve();
      });

      subject
        .batchWriteBasic(params)
        .then(() => done())
        .catch(err => done(err));
    });
  });
});
