'use strict';

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    node: true,
    es6: true,
    'jest/globals': true
  },
  extends: [
    'standard'
  ],
  plugins: [
    'node',
    'jest'
  ],
  rules: {
    // "no-var": "error",
    "prefer-const": ["error", {
      "destructuring": "any",
      "ignoreReadBeforeAssign": false
    }]
  }
};