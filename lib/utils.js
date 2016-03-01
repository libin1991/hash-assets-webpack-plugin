// utils

var fs = require('fs');
var path = require('path');
var colors = require('colors');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var pathSeparatorRe = /[\/\\]/g;

exports = module.exports = {

  realpath: function() {
    return path.resolve(Array.prototype.reduce.call(arguments, function(parts, part) {
      return path.join(parts, part)
    }, process.cwd()));
  },

  // Like mkdir -p. Create a directory and any intermediary directories. from grunt
  mkdir: function (dirpath, mode) {
    // Set directory mode in a strict-mode-friendly way.
    if (mode == null) {
      mode = parseInt('0777', 8) & (~process.umask());
    }
    dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
      parts += part + '/';
      var subpath = path.resolve(parts);
      if (!fs.existsSync(subpath)) {
        fs.mkdirSync(subpath, mode);
      }
      return parts;
    }, '');
  }
}
