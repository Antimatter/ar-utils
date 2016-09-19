var async = require('async');

module.exports.promiseDelay = function(t) {
    return new Promise(function(resolve) {
        setTimeout(resolve, t);
    });
};

module.exports.promiseMapSeries = function(A, pf) {
    return new Promise(function(resolve, reject) {
        async.mapSeries(
            A,
            function(a, callback) {
                pf(a)
                .then(function(value) {
                    callback(null, value);
                })
                .catch(callback);
            },
            function(error, results) {
                if (error) reject(error);
                else resolve(results);
            }
        );
    });
};

module.exports.promiseRetry = function(pf, times, interval) {
    if (!times) times = 0;
    if (!interval) interval = 0;

    return new Promise(function(resolve, reject) {
        var count = 0;
        async.retry(
            {times: times, interval: interval},

            function(callback) {
                pf()
                .then(function(msg) {
                    callback(null, {msg: msg, count: count});
                })
                .catch(function() {
                    count++;
                    callback(true);
                });
            },

            function(error, result) {
                if (error) {
                    reject('retry error, count:' + count);
                }
                else {
                    resolve(result);
                }
            }
        );
    });
};

module.exports.retryForever = function(interval, pf) {
    return new Promise(function(resolve) {
        var result = null;
        var done = false;
        async.whilst(
            function() { return !done; },
            function(callback) {
                pf().then(function(r) {
                    result = r;
                    done = true;
                    callback();
                })
                .catch(function() {
                    setTimeout(callback, interval);
                });
            },
            function() {
                resolve(result);
            }
        );
    });
};

module.exports.promiseEachSeries = function(A, pf) {
    return new Promise(function(resolve, reject) {
        async.eachSeries(
            A,
            function(a, callback) {
                pf(a)
                .then(function() { callback(); })
                .catch(function(error) { callback(error); });
            },
            function(error) {
                if (error) reject(error);
                else resolve();
            }
        );
    });
};

module.exports.promiseForEachOfSeries = function(O, pf) {
    return new Promise(function(resolve, reject) {
        async.forEachOfSeries(
            O,
            function(value, key, callback) {
                pf(value, key)
                .then(function() { callback(); } )
                .catch(function(error) { callback(error); });
            },
            function(error) {
                if (error) reject(error);
                else resolve();
            }
        );
    });
};

module.exports.promiseWhilst = function(check, pf) {
    return new Promise(function(resolve, reject) {
        async.whilst(
            check,
            function(callback) {
                pf()
                .then(function() { callback(); } )
                .catch(function(error) { callback(error); });
            },
            function(error) {
                if (error) reject(error);
                else resolve();
            }
        );
    });
};

module.exports.endsWith = function(s, e) {
    return s.indexOf(e) === s.length - e.length;
};

module.exports.basename = function(fn) {
    var tfn = fn[fn.length - 1] === '/' ? fn.slice(0, fn.length - 1) : fn;
    console.log(tfn);
    return tfn.slice(tfn.lastIndexOf('/') + 1);
};

module.exports.filename = function(fn) {
    var tfn = fn[fn.length - 1] === '/' ? fn.slice(fn.length - 1, fn.length) : fn;
    console.log(tfn);
    return tfn.slice(tfn.lastIndexOf('/') + 1);
};

function _deDuplicate(data) {
    var result = [];
    data.map(function(item) {
        if (!isNaN(item) && result.indexOf(item) === -1) {
            result.push(item);
        }
    });
    return result;
}

function _sortUp(data) {
    return data.sort(function(a, b) { return a - b; });
}

function _sortDown(data) {
    return data.sort(function(a, b) { return b - a; });
}

module.exports.deDup = _deDuplicate;
module.exports.sortUp = _sortUp;
module.exports.sortDown = _sortDown;

module.exports.findRuns = function(data) {

    var lastNumber = -1;
    var startRun = -1;
    data = _sortUp(_deDuplicate(data));
    data.push(-1);
    return data.map(function(number) {
        if (startRun === -1) {
            startRun = number;
            lastNumber = number;
            return null;
        }
        if (number - 1 === lastNumber) {
            lastNumber = number;
            return null;
        } else {
            var result = startRun === lastNumber ? lastNumber : startRun.toString() + '-' + lastNumber;
            startRun = number;
            lastNumber = number;
            return result;
        }
    }).filter(function(n){ return n; });
};


//console.log(findRuns([0,1,2,4,6,8,9,15,11,12,13]));
