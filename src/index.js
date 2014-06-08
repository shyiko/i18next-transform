var util = require('util');
var Transform = require('stream').Transform;

function I18NextTransform(options) {
  if (!(this instanceof I18NextTransform)) {
    return new I18NextTransform(options);
  }
  options || (options = {});
  var fn = options.fn || ['t'];
  if (!Array.isArray(fn)) {
    fn = [fn];
  }
  // shameless rip-off of karellm/i18next-parser
  var pattern = '[^a-zA-Z0-9_](?:(?:' + fn.join(')|(?:').replace('.', '\\.') +
    '))(?:\\(|\\s)\\s*(?:(?:\'((?:(?:\\\\\')?[^\']+)+[^\\\\])\')|(?:"((?:(?:\\\\")?[^"]+)+[^\\\\])"))';
  this._regexp = new RegExp(options.pattern || pattern, 'g');
  this._keys = [];
  this._previous = options.resource || {};
  this._defaultValue = options.defaultValue || '';
  Transform.call(this, {objectMode: true});
}

util.inherits(I18NextTransform, Transform);

I18NextTransform.prototype._transform = function (chunk, encoding, done) {
  var matches;
  while (matches = this._regexp.exec(chunk.toString())) {
    this._keys.push(matches[1] || matches[2]);
  }
  done();
};

I18NextTransform.prototype._flush = function (done) {
  var previousHash = objectToHash(this._previous);
  // group by "significant part"
  var previousHashGroupedBySP = {};
  Object.keys(previousHash).forEach(function (key) {
    var indexOfDelimiter = key.indexOf('_');
    var k1 = key, k2 = '';
    if (~indexOfDelimiter) {
      k1 = key.slice(0, indexOfDelimiter);
      k2 = key.slice(indexOfDelimiter + 1);
    }
    previousHashGroupedBySP[k1] || (previousHashGroupedBySP[k1] = {});
    previousHashGroupedBySP[k1][k2] = previousHash[key];
  });
  var mergeResult = merge(this._keys, previousHashGroupedBySP);
  this.emit('diff', {addedKeys: mergeResult.addedKeys, removedKeys: mergeResult.removedKeys});
  if (mergeResult.addedKeys.length) {
    var value = this._defaultValue;
    mergeResult.addedKeys.forEach(function (key) {
      mergeResult.hash[key] = value;
    });
  }
  this.push(hashToObject(mergeResult.hash));
  done();
};

function objectToHash(obj) {
  return flatten(obj)
    .reduce(function (obj, value) {
      var delimiterIndex = value.indexOf('=');
      obj[value.slice(0, delimiterIndex)] = value.slice(delimiterIndex + 1);
      return obj;
    }, {});
}

function flatten(obj) {
  var result = [];
  Object.keys(obj).forEach(function (key) {
    if (isObject(obj[key])) {
      flatten(obj[key]).forEach(function (value) {
        result.push(key + '.' + value)
      });
    } else {
      result.push(key + '=' + obj[key])
    }
  });
  return result;
}

// todo: make it "overridable"
function merge(keys, obj) {
  var result = {hash: {}, addedKeys: [], removedKeys: []};
  keys.forEach(function (key) {
    var node = obj[key];
    if (node) {
      result.hash[key] = node;
    } else {
      result.addedKeys.push(key);
    }
  });
  Object.keys(obj).forEach(function (key) {
    if (!~keys.indexOf(key)) { // fixme: n^2
      result.removedKeys.push(key);
    }
  });
  return result;
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function hashToObject(hash) {
  var result = {};
  Object.keys(hash).forEach(function (key) {
    var node = result;
    var split = key.split('.');
    var index;
    for (index = 0; index < split.length - 1; index++) {
      var k = split[index];
      node = (node[k] || (node[k] = {}));
    }
    var value = hash[key];
    if (isObject(value)) {
      Object.keys(value).forEach(function (k) {
        var suffix = k === '' ? '' : '_' + k;
        node[split[index] + suffix] = value[k];
      });
    } else {
      node[split[index]] = value;
    }
  });
  return result;
}

module.exports = I18NextTransform;
