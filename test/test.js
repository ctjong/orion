let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');

var assert = require('assert');

describe('Orion', function () 
{
    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function() {
            assert.equal([1,2,3].indexOf(4), -1);
        });
    });
});