"use strict";

const should = require("should");
const BatchGetParamsTakeManager = require("../lib/BatchGetParamsTakeManager");

describe("BatchGetParamsTakeManager", function() {
  const tests = [
    {
      args: {
        params: {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "a" }, { id: "b" }, { id: "c" }]
            }
          }
        },
        maxTake: 100
      },
      expected: [
        {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "a" }, { id: "b" }, { id: "c" }]
            }
          }
        }
      ]
    },
    {
      args: {
        params: {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "a" }, { id: "b" }, { id: "c" }]
            }
          }
        },
        maxTake: 2
      },
      expected: [
        {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "a" }, { id: "b" }]
            }
          }
        },
        {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "c" }]
            }
          }
        }
      ]
    },
    {
      args: {
        params: {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "1a" }, { id: "1b" }, { id: "1c" }],
              ConsistentRead: true
            },
            "Table-2": {
              Keys: [{ id: "2a" }, { id: "2b" }, { id: "2c" }],
              ConsistentRead: false
            }
          }
        },
        maxTake: 2
      },
      expected: [
        {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "1a" }, { id: "1b" }],
              ConsistentRead: true
            }
          }
        },
        {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "1c" }],
              ConsistentRead: true
            },
            "Table-2": {
              Keys: [{ id: "2a" }],
              ConsistentRead: false
            }
          }
        },
        {
          RequestItems: {
            "Table-2": {
              Keys: [{ id: "2b" }, { id: "2c" }],
              ConsistentRead: false
            }
          }
        }
      ]
    },
    {
      args: {
        params: {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "1a" }, { id: "1b" }, { id: "1c" }]
            },
            "Table-2": {
              Keys: [{ id: "2a" }, { id: "2b" }, { id: "2c" }]
            }
          }
        },
        maxTake: 3
      },
      expected: [
        {
          RequestItems: {
            "Table-1": {
              Keys: [{ id: "1a" }, { id: "1b" }, { id: "1c" }]
            }
          }
        },
        {
          RequestItems: {
            "Table-2": {
              Keys: [{ id: "2a" }, { id: "2b" }, { id: "2c" }]
            }
          }
        }
      ]
    }
  ];

  tests.forEach(test => {
    it(
      "should return " +
        JSON.stringify(test.expected) +
        " for args " +
        JSON.stringify(test.args),
      function() {
        const subject = new BatchGetParamsTakeManager(
          test.args.params,
          test.args.maxTake
        );
        const result = [];

        for (;;) {
          const take = subject.getTakeParams();

          if (take) {
            result.push(take);
          } else {
            break;
          }
        }

        should(result).eql(test.expected);
      }
    );
  });
});
