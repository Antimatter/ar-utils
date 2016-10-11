// jshint esversion:6
'use strict';

const async = require('async');
const crypto = require('crypto');
const exec = require('child_process').exec;

module.exports.gitRevision = function() {
    return new Promise(function(resolve, reject) {
        exec('git rev-parse --verify HEAD', function(error, stdout, stderr) {
            if (error) {
                reject(stderr);
            }
            else {
                resolve(stdout);
            }
        });
    });
};

module.exports.hashUrl = function(url) {
    return crypto.createHash('md5').update(url).digest("hex");
};

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
                    msg.count = count;
                    callback(null, msg);
                })
                .catch(function(err) {
                    count++;
                    //callback(true);
                    callback(err);
                });
            },

            function(error, result) {
                if (error) {
                    reject(error + ', retries:' + count);
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
                .catch(function(error) {
                    if (error) callback(error);
                    else callback('promiseWhilst err');
                });
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
    return tfn.slice(tfn.lastIndexOf('/') + 1);
};

module.exports.filename = function(fn) {
    var tfn = fn[fn.length - 1] === '/' ? fn.slice(fn.length - 1, fn.length) : fn;
    return tfn.slice(tfn.lastIndexOf('/') + 1);
};


// function _extension(s) {
//     var i = s.indexOf('.') + 1;
//     return i > 0 ? _extension(s.substring(i)) : s;
// }
//
// module.exports.oldExt = _extension;

module.exports.extension = function(s) {
    var ext = s.match(/\.[^\.]*$/);
    return ext ? ext[0].substring(1) : null;
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

var request = require('request-promise-native');

module.exports.getHeaders = function(path) {
    return new Promise(function(resolve, reject) {
        var Url = require('url');

        var url = null;
        if (path.constructor.name === 'Url') {
            url = path;
        }
        else {
            url = Url.parse(path);
        }

        request.get({
            method: 'HEAD',
            uri: url.href
        })
        .on('response', function(response) {
            resolve(response.headers);
        })
        .catch(function(error) {
            reject(error);
        });
    });
};

var Url = require('url');
var head = require('head-tail-stream');
const arrayFromStream = require('./arrayFromStream');

module.exports.getHead = function(path, n) {
    let url = (path.constructor.name === 'Url') ? path : Url.parse(path);

    return new Promise(function(resolve, reject) {
        request({
            method: 'GET',
            uri: url.href
        })
        .pipe(head(n))
        .pipe(arrayFromStream())
        .on('data', function(lines) {
            resolve(lines);
        })
        .on('error', function(error) {
            reject(error);
        });
    });
};

module.exports.url = function(path) {
    switch(path.constructor.name) {
        case 'Url':
        return path;

        case 'String':
        return Url.parse(path);

        default:
        return '';
    }
};

var fs = require('fs');

module.exports.ls = function(dir, regex) {
    return new Promise(function(resolve, reject) {
        fs.readdir(dir, function(error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data.filter(function(x) {
                    return x.match(regex);
                }));
            }
        });
    });
};

module.exports.fsStat = function(path) {
    return new Promise(function(resolve, reject) {
        fs.stat(path, function(error, stats) {
            if (error) {
                reject(error);
            } else {
                resolve(stats.isFile());
            }
        });
    });
};

module.exports.fsWriteFile = function(path, data) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, data, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

module.exports.fsReadFile = function(path) {
    return new Promise(function(resolve, reject) {
        fs.readFile(path, function(error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
};

module.exports.fsRmdir = function(path) {
    return new Promise(function(resolve, reject) {
        fs.rmdir(path, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

module.exports.fsUnlink = function(path) {
    return new Promise(function(resolve, reject) {
        fs.unlink(path, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};


//console.log(findRuns([0,1,2,4,6,8,9,15,11,12,13]));
