var fs = require('fs');
var path = require('path');
var merge = require('lodash.merge');
var  utils = require('./lib/utils');
var extractAssets = require('./lib/extractAssets');

function HashAssetsPlugin (options) {
  this.options = merge({}, {
    path: '.',
    filename: 'assets-hash.json',
    hashLength: 20,
    prettyPrint: false,
    srcPath: '.',
    srcMatch: {},
    exclude: ['://'],
    assetsMatch: {
      css: /\(['"]?([^\(\)]+\.(?:gif|png|jpg|css))['"]?\)/gi
    },
    assetNameTemplate: '[name].[hash]'
  }, options);
}

HashAssetsPlugin.prototype = {

  constructor: HashAssetsPlugin,

  apply: function (compiler) {
    var options = this.options;

    compiler.plugin('after-emit', function (compilation, callback) {

      var stats = compilation.getStats().toJson({
        hash: false,
        publicPath: false,
        assets: false,
        chunks: true,
        modules: false,
        source: false,
        errorDetails: false,
        timings: false
      });

      var chunks = stats.chunks;

      var hashMap = {};
      chunks.forEach(function (chunk) {
        if(chunk.names.length){
          hashMap[options.chunkNameTemplate.replace('[name]', chunk.names[0])] =  chunk.hash.substr(0, options.hashLength);
        }
      });

      callback();

      var assetsHash = extractAssets(options);

      Object.assign(hashMap, assetsHash);
      var output = JSON.stringify(hashMap, 'null', options.prettyPrint ? '\t' : '');
      var outputPath = path.join(options.path, options.filename);
      utils.mkdir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, output);

      process.stdout.write('Assets Hash Generated: ' + options.filename.info + '\n');
    });
  }
};

module.exports = HashAssetsPlugin;
