// jshint esversion:6
// jshint mocha:true
'use strict';

const utils = require('../index');
const expect = require("chai").expect;

describe('utils', function() {
    describe('#promiseFilter', function() {
        it('should filter and not reject anything', function() {
            var things = ['1', '2', 'a', 'foo', '3', null, '4'];
            return utils.promiseFilter(
                things,
                function(thing) {
                    return new Promise(function(resolve) {
                        var ok = !isNaN(parseInt(thing));
                        console.log(thing, ok);
                        setTimeout(function() {
                            resolve(ok);
                        }, 100);
                    });
                }
            )
            .then(function(result) {
                console.log('result:', result);
                expect(result).to.deep.equal(['1', '2', '3', '4']);
            });
        });
    });
    describe('#promiseFilterSeries', function() {
        it('should filter and not reject anything', function() {
            var things = ['1', '2', 'a', 'foo', '3', null, '4'];
            return utils.promiseFilterSeries(
                things,
                function(thing) {
                    return new Promise(function(resolve) {
                        var ok = !isNaN(parseInt(thing));
                        console.log(thing, ok);
                        setTimeout(function() {
                            resolve(ok);
                        }, 100);
                    });
                }
            )
            .then(function(result) {
                console.log('result:', result);
                expect(result).to.deep.equal(['1', '2', '3', '4']);
            });
        });
    });
});
