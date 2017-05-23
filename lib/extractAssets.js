// extract assets into output dir

var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var utils = require('./utils');
var pkg = require('../package.json');

var realpath = utils.realpath;
var ENCODING = 'utf8', ALGORITHM = 'md5';
// all res hash map
var hash_map = {};
// assets in src
var src_hash_map = {};
var config;

var dynamic_require_hash_map_template = [
  '\n\nif(__fad_dynamic_require_hash_map_extend__===undefined){var __fad_dynamic_require_hash_map_extend__=function(a,b){for(var k in b){a[k]=b[k]}}}\n',
  'var __fad_dynamic_require_hash_map__ = __fad_dynamic_require_hash_map__ || {};\n',
  '__fad_dynamic_require_hash_map_extend__(__fad_dynamic_require_hash_map__, MAP)\n'
].join('');

module.exports = function(options) {
  config = options;
  // commmon resources extract
  process.stdout.write('\nVersion: Hash Assets Webpack Plugin ' + pkg.version + '\n');
  process.stdout.write('Extract assets'.underline + '\n');
  for(var src in config.srcMatch){
    var files = glob.sync(src, {cwd: realpath()});
    files.map(function(f){
      extractAssets(f, false, config.srcMatch[src]);
    });
  }

  return src_hash_map;
};

// assets extract
function extractAssets(file, is_res, pattern){

  var dist_file = file;
  if(is_res){
    dist_file = copyRes(file, is_res);
    // res not exists
    if(!dist_file){
      return false;
    }
  }

  var res = resolve(dist_file, pattern);

  var replace_list = [];
  // map of dynamic require res
  var dynamic_res_map = {};
  res.forEach(function(r){
    if(Array.isArray(r)){
      r = r[0];
      dynamic_res_map[r] = r;
    }
    var real_r = r, newPath;
    if(is_res && /^\.{1,2}\//.test(r)){
      real_r = path.join(path.dirname(file), r);
    }
    if(hash_map[real_r]){
      if(config.hash){
        newPath = hashSuffix(r, hash_map[real_r]);
        // console.log(('Already Extracted: ' + file).blue);
        if(is_res){
          replace_list.push([r, newPath]);
        }
        if(pattern){
          src_hash_map[r] = hash_map[real_r];
        }
        if(dynamic_res_map[r]){
          dynamic_res_map[r] = newPath;
        }
      }
      return;
    }
    var dist_r;
    if(Object.keys(config.assetMatch).indexOf(extname(r)) > -1){
      dist_r = extractAssets(r, true);
    } else {
      dist_r = copyRes(r, file);
    }
    // res not exists
    if(!dist_r){
      return;
    }

    if(config.hash){
      hash_map[real_r] = sha(dist_r);
      newPath = hashSuffix(r, hash_map[real_r]);
      if(dynamic_res_map[r]){
        dynamic_res_map[r] = newPath;
      }
      fs.renameSync(realpath(dist_r), realpath(path.dirname(dist_r), path.basename(newPath)));
      if(is_res){
        replace_list.push([r, newPath]);
      } else {
        src_hash_map[r] = hash_map[real_r];
      }
    }
  });

  if(config.hash){
    if(replace_list.length && is_res){
      // console.info('Update file: '.verbose + dist_file)
      updateFile(dist_file, replace_list);
    }

    // append dynamic require res map to given file
    // console.log(dynamic_res_map)
    if(Object.keys(dynamic_res_map).length){
      append_dynamic_hashmap(dist_file, dynamic_res_map);
    }
  }

  return dist_file;
}

// extract resources from given file
function resolve(filepath, re){
  var res_list = [], dynamic_re, is_res;
  if(!re){
    var ext = extname(filepath);
    re = config.assetMatch[ext];
    dynamic_re = config.res_dynamic_pattern;
    is_res = true;
  } else {
    dynamic_re = config.src_dynamic_pattern;
  }
  var content = fs.readFileSync(realpath(filepath), ENCODING);
  var matches;
  while(matches = re.exec(content)){
    var r = matches[1];
    if(config.exclude.some(function (element){return r.indexOf(element) > -1;})){
      continue;
    }
    res_list.push(r);
  }

  // dynamic require in src html files
  while(matches = dynamic_re.exec(content)){
    var dynamic_res = extractDynamicRes(matches[1], new RegExp(matches[2]), is_res);
    Array.prototype.push.apply(res_list, dynamic_res);
  }

  return res_list;
}

// extract dynamic require resources with given RegExp
function extractDynamicRes(dir, re, is_res){
  var glob_pattern = dir.replace(/\/$/, '') + '/**/*.*';
  return glob.sync(glob_pattern, {cwd: realpath(config.srcPath)}).filter(function(file){
    return re.test(file);
  }).map(function(file){
    file = file.replace(/^\.\//, '');
    if(is_res) {
      file = [file];
    }
    return file;
  });
}

// generate hash map json file for HashMapGenerate mode.
function append_dynamic_hashmap(target_file, hashmap){
  var maps = JSON.stringify(hashmap, 'null', '\t');
  fs.appendFileSync(target_file, dynamic_require_hash_map_template.replace('MAP', maps));
  process.stdout.write('Dynamic require resource hash map insert into: ' + target_file + '\n');
}

// copy file from src to dist dir
function copyRes(file, ref){
  var src_dir = config.srcPath;
  if(ref &&  /^\.{1,2}\//.test(file)){
    file = path.join(path.dirname(ref), file);
  }
  var src = path.join(src_dir, file);
  var dest = path.join(config.path, file);
  if(config.hash && fs.existsSync(realpath(dest))){
    // console.log(('Already Extracted: ' + file).blue);
    return dest;
  }
  if(fs.existsSync(realpath(src))){
    copy(src, dest);
    process.stdout.write(file.info + '\n');
    return dest;
  } else {
    process.stdout.write('WRAN: '.warn + 'Asset "' + src.bold.error + '" not exist.' + '\n');
    return false;
  }
}

// update reference source file with hash suffix
function updateFile(file, replace_list) {
  file = realpath(file);
  var contents = fs.readFileSync(file, ENCODING);

  replace_list.forEach(function(r){
    contents = contents.replace(r[0], r[1]);
  });
  fs.writeFileSync(file, contents);
}

// add hash suffix to resource
function hashSuffix(filepath, hash){
  var basename = path.basename(filepath, path.extname(filepath));
  var new_name = config.assetNameTemplate.replace('[name]', basename).replace('[hash]', hash.substr(0, config.hashLength));
  return path.join(path.dirname(filepath),  new_name + path.extname(filepath));
}

// hash file
function sha(file, isString){
  var shasum = crypto.createHash(ALGORITHM);
  if(!isString){
    // console.info('File hashed: '.verbose + file)
    file = fs.readFileSync(realpath(file));
  }
  shasum.update(file, ENCODING);
  var d = shasum.digest('hex');
  return d.substr(0, 7);
}

function extname(filepath){
  return path.extname(filepath).substr(1);
}

function copy(src, dest){
  var contents = fs.readFileSync(realpath(src));
  dest = realpath(dest);
  utils.mkdir(path.dirname(dest));
  fs.writeFileSync(dest, contents);
}

