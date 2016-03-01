hash-assets-webpack-plugin
=====================

Get chunks hash from webpack stats and extracted assets from dynamic templates, emits a json file with all assets hash.

## Why is this useful?

This plug-in outputs a json file with the hash map of the generated webpack assets(chunks).

And it could extracted assets from giving dynamic templates to the output dir, like Php templates, JSP.

### Example output:

The output is a JSON object in the form:

```json
{
    "js/main.js": "bc675f6",
    "js/commons.js": "5d32ba5"
}
```

## Install

```sh
npm install hash-assets-webpack-plugin --save-dev
```

## Configuration

In your webpack config include the plug-in. And add it to your config:

```js
var path = require('path');
var HashAssetsPlugin = require('hash-assets-webpack-plugin');

module.exports = {
    // ...
    output: {
        path: path.join(__dirname, "static"),
        filename: "js/[name].[chunkhash].js",
        publicPath: "/static/"
    },
    // ....
    plugins: [
        new HashAssetsPlugin({
            path: './static',
            chunkNameTemplate: 'js/[name].js',
            hashLength: 7,
            srcPath: './src',
            srcMatch: {
                'home.tpl': /['"]([^'"]+\.(?:css|png|jpg))['"]/gi
            },
            assetMatch: {
                css: /\(['"]?([^\(\)]+\.(?:gif|png|jpg))['"]?\)/gi
            },
            assetNameTemplate: '[name].[hash]',
            prettyPrint: true
        })
    ]
};
```

### Options

You can pass the following options:

__filename__: Name for the created json file. Defaults to `assets-hash.json`

```js
new AssetsPlugin({filename: 'assets.json'})
```

__path__: Path where to output extracted assets. Defaults to the current directory.

```js
new AssetsPlugin({path: './static'})
```

__prettyPrint__: Whether to format the json output for readability. Defaults to false.

```js
new AssetsPlugin({prettyPrint: true})
```

__chunkNameTemplate__: chunks name value in hash json file.


__hashLength__: Length of hash.

```js
new AssetsPlugin({hashLength: 7})
```

__srcPath__

__srcMatch__

__assetMatch__

__assetNameTemplate__


### Using this with Php

## Changelog

__0.1.0__ First version

