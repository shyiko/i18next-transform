# i18next-transform

[i18next](http://i18next.com/) resource generator for Node.js.

It's an alternative to [karellm/i18next-parser](https://github.com/karellm/i18next-parser) which:

1. does not force you to a particular project structure (you control both reads/writes). 
2. (direct consequence of the previous point) does not generate unnecessary `_old.json` file (we are all using RCS after all).
3. provides information of what has actually changed ('diff' event).
4. works correctly with plurals.

## I18NextTransform(options)

```
{String} resource
{String|Array} [fn] ('t' by default)
{String} [pattern]
{String} [defaultValue] ('' by default)
```

## Usage (example)

```js
var fs = require('fs');
var stringify = require('json-stable-stringify');
var I18NextTransform = require('i18next-transform');

var file = 'i18n/workflow_en-US.json';

fs.readFile(file, 'utf-8', function (err, data) {
    if (err && err.code !== 'ENOENT') {
        throw err;
    }
    var input = JSON.parse(data);
    passThroughI18NextTransform(input, function (err, output) {
        if (err) {
            throw err;
        }
        fs.writeFile(file, stringify(output, {space: '\t'}), 'utf-8');
    });
});

function passThroughI18NextTransform(input, callback) {
    var stream = new I18NextTransform({resource: input});

    // call for as many files as you want
    // stream will extract and accumulate translation keys up until the 'end'
    stream.write(fileContentAsAString);

    // you may also want to stream.on('diff', function (e) { ... })
    // to get access to the list of added (e.addedKeys) / removed (e.removedKeys) translation keys

    stream.end(function () {
        callback(null, stream.read() /* updated output object */);
    });
}
```

## License

[MIT License](http://opensource.org/licenses/mit-license.php)
