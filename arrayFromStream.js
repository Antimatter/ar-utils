// jshint esversion:6
'use strict';

const Writable = require('stream').Writable;
const EventEmitter = require('events').EventEmitter;

class ArrayFromStream extends Writable {
    constructor(options) {
        if (!options) options = {};
        options.objectMode = true;
        super(options);
        EventEmitter.call(this);
        this.array = [];
    }

    _write(chunk, encoding, callback) {
        if (chunk.constructor.name === 'String') {
            this.array.push(chunk.trim());
            if (callback) callback();
        } else {
            if (callback) callback(new Error('unknown stream payload type'));
        }
    }

    end(chunk, encoding, callback) {
        var self = this;
        if (chunk)
            this.write(chunk, encoding);
        self.emit('data', this.array);
        if (callback) callback();
    }
}

module.exports = function() { return new ArrayFromStream(); };
