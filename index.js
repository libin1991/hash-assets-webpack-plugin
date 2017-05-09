var fs = require('fs');
var path = require('path');
var merge = require('lodash.merge');
var utils = require('./lib/utils');
var extractAssets = require('./lib/extractAssets');

function HashAssetsPlugin (options) {
  this.options = merge({}, {
    path: '.',
    filename: 'assets-hash.json',
    keyTemplate: 'js/[name].js',
    hashLength: 20,
    prettyPrint: false,
    srcPath: '.',
    srcMatch: {},
    exclude: ['://'],
    assetMatch: {
      css: /\(['"]?([^\(\)]+\.(?:gif|png|jpg|css))['"]?\)/gi
    },
    // dynamic require match string convention in src html files:
    // 1st part: directory start with './', relative to staic dir,
    // 2nd part: regexp warp with '/', may contain folder directory,
    // 2 parts separate with comma.
    // e.g. './images', '/abc-\d+\.png$/',
    // matched of './images/abc-1.png', './images/abc-2.png', ...
    src_dynamic_pattern: /['"](\.\/[^'"]+)['"]\s*,\s*['"]\/(.+?)\/['"]/gi,
    // dynamic require match string convention in js files:
    // 1st part: directory start with './', relative to staic dir,
    // 2nd part: regexp of path, end with $, may contain folder directory,
    // 2 parts separate with comma.
    // e.g. './images', '/[\w-]+\/abc-\d+\.png$/',
    // matched of './images/abc-1.png', './images/xx/abc-2.png', ...
    res_dynamic_pattern: /['"](\.\/[^'"]+)['"]\s*,\s*\/([^\$]+\$)\//gi,
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
        if(chunk.initial && chunk.names.length){
          chunk.files.forEach(function (file) {
            var key;
            if(typeof options.keyTemplate === 'string'){
              key = options.keyTemplate.replace('[name]', chunk.names[0]);
            } else if(typeof options.keyTemplate === 'function') {
              key = options.keyTemplate(file);
            }
            hashMap[key] = chunk.hash.substr(0, options.hashLength);
          });
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
