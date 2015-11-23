'use strict';
var jitGrunt = require('./lib/jit-grunt');
var path = require('path');

module.exports = function (grunt, mappings) {
  var jit = jitGrunt(grunt, mappings);
  return function (options) {
    options = options || {};

    if (options.loadTasks) {
      options.loadTasks = options.loadTasks || [ ];
      jit.customTasksDirs = options.loadTasks.map((dir) => {
        return path.resolve(dir);
      });
    }

    if (options.customTasksDirs) {
      options.customTasksDirs = options.customTasksDirs || [ ];
      jit.customTasksDirs = options.customTasksDirs.map((dir) => {
        return path.resolve(dir);
      });
    }

    if (options.pluginsRoots) {
      jit.pluginsRoots = options.pluginsRoots;
    }
  };
};
