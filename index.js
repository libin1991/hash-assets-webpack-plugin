const fs = require('fs')
const path = require('path')
const utils = require('./lib/utils')
const extractAssets = require('./lib/extractAssets')

class HashAssetsPlugin {
  constructor (options) {
    this.options = Object.assign({}, {
      // path: '.',
      hash: true,
      filename: 'assets-hash.json',
      keyTemplate: 'js/[name].js',
      hashLength: 20,
      prettyPrint: false,
      srcPath: '.',
      srcMatch: {},
      exclude: ['://'],
      assetMatch: {
        css: /\(['"]?([^()]+\.(?:gif|png|jpg|css))['"]?\)/gi
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
      res_dynamic_pattern: /['"](\.\/[^'"]+)['"]\s*,\s*\/([^$]+\$)\//gi,
      assetNameTemplate: '[name].[hash]'
    }, options)
  }

  apply (compiler) {
    const options = this.options

    compiler.hooks.emit.tapAsync('HashAssetsPlugin', (compilation, callback) => {
      const stats = compilation.getStats().toJson({
        hash: false,
        publicPath: false,
        assets: false,
        chunks: true,
        modules: false,
        source: false,
        errorDetails: false,
        timings: false
      })

      const hashMap = {}
      stats.chunks.forEach((chunk) => {
        if (chunk.initial && chunk.names.length) {
          chunk.files.forEach((file) => {
            let key
            if (typeof options.keyTemplate === 'string') {
              key = options.keyTemplate.replace('[name]', chunk.names[0])
            } else if (typeof options.keyTemplate === 'function') {
              key = options.keyTemplate(file)
            }
            if (Array.isArray(key) && key.length === 2) {
              hashMap[key[0]] = key[1]
            } else {
              hashMap[key] = chunk.hash.substr(0, options.hashLength)
            }
          })
        }
      })

      if (options.hash) {
        const assetsHash = extractAssets(options)

        Object.assign(hashMap, assetsHash)
        const output = JSON.stringify(hashMap, 'null', options.prettyPrint ? '\t' : '')
        const outputPath = path.join(options.path || stats.outputPath || '.', options.filename)
        utils.mkdir(path.dirname(outputPath))
        fs.writeFileSync(outputPath, output)

        process.stdout.write('Assets Hash Generated: ' + options.filename.info + '\n')

        callback()
      } else {
        extractAssets(options)
        callback()
      }
    })
  }
}

module.exports = HashAssetsPlugin
