'use strict';

const should = require('should');
const clientWrapper = require('../index.js');

describe('dynamodb-doc-client-wrapper', function() {
    it('should construct', function() {
        should(clientWrapper.batchWrite).eql(null);
    });
});
