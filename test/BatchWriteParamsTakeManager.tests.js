'use strict';

const should = require('should');
const BatchWriteParamsTakeManager = require('../lib/BatchWriteParamsTakeManager');

describe('BatchWriteParamsTakeManager', function() {
    const tests = [
        {
            args: {
                params: {
                    RequestItems: {
                        'Table-1': [
                            { PutRequest: { Item: { id: 'a' } } }
                        ]
                    }
                },
                maxTake: 100
            },
            expected: [{
                RequestItems: {
                    'Table-1': [
                        { PutRequest: { Item: { id: 'a' } } }
                    ]
                }
            }]
        }, {
            args: {
                params: {
                    RequestItems: {
                        'Table-1': [
                            { PutRequest: { Item: { id: 'a' } } },
                            { PutRequest: { Item: { id: 'b' } } },
                            { PutRequest: { Item: { id: 'c' } } }
                        ]
                    }
                },
                maxTake: 2
            },
            expected: [{
                RequestItems: {
                    'Table-1': [
                        { PutRequest: { Item: { id: 'a' } } },
                        { PutRequest: { Item: { id: 'b' } } }
                    ]
                }
            }, {
                RequestItems: {
                    'Table-1': [
                        { PutRequest: { Item: { id: 'c' } } }
                    ]
                }
            }]
        }, {
            args: {
                params: {
                    RequestItems: {
                        'Table-1': [
                            { PutRequest: { Item: { id: '1a' } } },
                            { PutRequest: { Item: { id: '1b' } } },
                            { PutRequest: { Item: { id: '1c' } } }
                        ],
                        'Table-2': [
                            { PutRequest: { Item: { id: '2a' } } },
                            { PutRequest: { Item: { id: '2b' } } },
                            { PutRequest: { Item: { id: '2c' } } }
                        ]
                    }
                },
                maxTake: 2
            },
            expected: [{
                RequestItems: {
                    'Table-1': [
                        { PutRequest: { Item: { id: '1a' } } },
                        { PutRequest: { Item: { id: '1b' } } }
                    ]
                }
            }, {
                RequestItems: {
                    'Table-1': [
                        { PutRequest: { Item: { id: '1c' } } }
                    ],
                    'Table-2': [
                        { PutRequest: { Item: { id: '2a' } } }
                    ]
                }
            }, {
                RequestItems: {
                    'Table-2': [
                        { PutRequest: { Item: { id: '2b' } } },
                        { PutRequest: { Item: { id: '2c' } } }
                    ]
                }
            }]
        }, {
            args: {
                params: {
                    RequestItems: {
                        'Table-1': [
                            { PutRequest: { Item: { id: '1a' } } },
                            { PutRequest: { Item: { id: '1b' } } },
                            { PutRequest: { Item: { id: '1c' } } }
                        ],
                        'Table-2': [
                            { PutRequest: { Item: { id: '2a' } } },
                            { PutRequest: { Item: { id: '2b' } } },
                            { PutRequest: { Item: { id: '2c' } } }
                        ]
                    }
                },
                maxTake: 3
            },
            expected: [{
                RequestItems: {
                    'Table-1': [
                        { PutRequest: { Item: { id: '1a' } } },
                        { PutRequest: { Item: { id: '1b' } } },
                        { PutRequest: { Item: { id: '1c' } } }
                    ]
                }
            }, {
                RequestItems: {
                    'Table-2': [
                        { PutRequest: { Item: { id: '2a' } } },
                        { PutRequest: { Item: { id: '2b' } } },
                        { PutRequest: { Item: { id: '2c' } } }
                    ]
                }
            }]
        }
    ];

    tests.forEach((test) => {
        it('should return ' + JSON.stringify(test.expected) + ' for args ' + JSON.stringify(test.args), function() {
            const subject = new BatchWriteParamsTakeManager(test.args.params, test.args.maxTake);
            const result = [];

            while (true) { // eslint-disable-line no-constant-condition
                const take = subject.getTakeParams();

                if (take) {
                    result.push(take);
                } else {
                    break;
                }
            }
            
            should(result).eql(test.expected);
        });
    });
});
