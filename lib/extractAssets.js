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
  res.forEach(function(r){
    var real_r = r;
    if(is_res && /^\.{1,2}\//.test(r)){
      real_r = path.join(path.dirname(file), r);
    }
    if(hash_map[real_r]){
      // console.log(('Already Extracted: ' + file).blue);
      if(is_res){
        replace_list.push([r, hashSuffix(r, hash_map[real_r])]);
      }
      // fix #1, !is_res also work?
      if(pattern){
        src_hash_map[r] = hash_map[real_r];
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

    hash_map[real_r] = sha(dist_r);
    var newPath = hashSuffix(r, hash_map[real_r]);
    fs.renameSync(realpath(dist_r), realpath(path.dirname(dist_r), path.basename(newPath)));
    if(is_res){
      replace_list.push([r, newPath]);
    } else {
      src_hash_map[r] = hash_map[real_r];
    }
  });

  if(replace_list.length && is_res){
    // console.info('Update file: '.verbose + dist_file)
    updateFile(dist_file, replace_list);
  }

  return dist_file;
}

// extract resources from given file
function resolve(filepath, re){
  var res_list = [];
  if(!re){
    var ext = extname(filepath);
    re = config.assetMatch[ext];
  }
  var content = fs.readFileSync(realpath(filepath), ENCODING);
  var match;
  while(match = re.exec(content)){
    var r = match[1];
    if(config.exclude.some(function (element){return r.indexOf(element) > -1;})){
      continue;
    }
    res_list.push(r);
  }
  return res_list;
}

// copy file from src to dist dir
function copyRes(file, ref){
  var src_dir = config.srcPath;
  if(ref &&  /^\.{1,2}\//.test(file)){
    file = path.join(path.dirname(ref), file);
  }
  var src = path.join(src_dir, file);
  var dest = path.join(config.path, file);
  if(fs.existsSync(realpath(dest))){
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

