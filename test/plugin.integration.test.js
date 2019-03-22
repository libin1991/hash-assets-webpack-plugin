const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const rm = require('rimraf')
const HashAssetsPlugin = require('../index')

jest.setTimeout(60000)

describe('Hash Map Generate Case Test', () => {
  const testDirectory = path.join(__dirname, 'fixtures')

  it('generate a hash map json file', (done) => {
    const outputDirectory = path.join(__dirname, 'actual', 'hash_generate')
    const configFile = path.join(testDirectory, 'webpack.config.js')

    const options = require(configFile)

    options.entry = {
      a: './a.js',
      b: './b.js'
    }
    options.context = testDirectory

    if (!options.output.path) options.output.path = outputDirectory

    options.plugins.push(new HashAssetsPlugin({
      // path: outputDirectory,
      filename: 'assets.json',
      // hashLength: 7,
      keyTemplate: function (filename) {
        const match = /([\w-]+)\.\w{20}\.(css|js)/.exec(filename)
        return [match[1] + '.' + match[2], filename]
      },
      prettyPrint: true
    }))

    // console.log(
    //   `\nwebpack.config.js ${JSON.stringify(
    //     options,
    //     null,
    //     2
    //   )}`
    // );

    rm(outputDirectory, (err) => {
      if (err) throw err

      webpack(options, (err, stats) => {
        // console.log(stats.compilation.errors)
        expect(err).toBeFalsy()
        expect(stats.hasErrors()).toBe(false)

        const hashMap = JSON.parse(fs.readFileSync(path.join(outputDirectory, 'assets.json'), 'utf8'))
        expect(hashMap).toEqual({
          'common.js': 'common.1a95d5761925f490d6ec.js',
          'a.css': 'a.752b558ac8ae5a0ffa0d.css',
          'a.js': 'a.7e2ee77517c8ea761cb0.js',
          'b.js': 'b.a5e83f59c07fa9ea791d.js'
        })
        done()
      })
    })
  })
})
