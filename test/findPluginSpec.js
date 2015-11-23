/* global describe, beforeEach, it */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('power-assert');
const grunt = require('grunt');
const jit = require('../lib/jit-grunt')(grunt);

const sinon = require('sinon');
const existsSync = sinon.stub(fs, 'existsSync');
const loadPlugin = sinon.stub(jit, 'loadPlugin');

describe('Plugin find', () => {

  beforeEach(() => {
    jit.customTasksDirs = undefined;
    jit.mappings = {
      bar: 'grunt-foo'
    };
    jit.pluginsRoots = ['node_modules'];
    existsSync.reset();
    loadPlugin.reset();
  });

  it('grunt-contrib-foo', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['grunt-contrib-foo', path.resolve('node_modules/grunt-contrib-foo/tasks')]);
  });

  it('grunt-foo', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['grunt-foo', path.resolve('node_modules/grunt-foo/tasks')]);
  });

  it('foo', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/foo/tasks')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('node_modules/foo/tasks')]);
  });

  it('CamelCase', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo-bar/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo-bar/tasks')).returns(true);

    jit.findPlugin('fooBar');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['grunt-foo-bar', path.resolve('node_modules/grunt-foo-bar/tasks')]);
  });

  it('snake_case', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo-bar/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo-bar/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/foo-bar/tasks')).returns(true);

    jit.findPlugin('foo_bar');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo-bar', path.resolve('node_modules/foo-bar/tasks')]);
  });

  it('Custom task', () => {
    jit.customTasksDirs = [path.resolve('custom')];

    existsSync.withArgs(path.resolve('custom/foo.js')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('custom/foo.js'), true]);
  });

  it('Custom task: CoffeeScript', () => {
    jit.customTasksDirs = [path.resolve('custom')];

    existsSync.withArgs(path.resolve('custom/foo.js')).returns(false);
    existsSync.withArgs(path.resolve('custom/foo.coffee')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('custom/foo.coffee'), true]);
  });

  it('Custom task multiple dirs', () => {
    jit.customTasksDirs = [path.resolve('custom'), path.resolve('other-custom')];

    existsSync.withArgs(path.resolve('other-custom/bar.js')).returns(true);
    existsSync.withArgs(path.resolve('custom/foo.coffee')).returns(true);

    jit.findPlugin('bar');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['bar', path.resolve('other-custom/bar.js'), true]);

    loadPlugin.reset();

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('custom/foo.coffee'), true]);
  });

  it('findUp', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('../node_modules/grunt-contrib-foo/tasks')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['grunt-contrib-foo', path.resolve('../node_modules/grunt-contrib-foo/tasks')]);
  });

  it('not Found', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('../node_modules/grunt-contrib-foo/tasks')).returns(false);

    jit.findPlugin('foo');

    assert(loadPlugin.callCount === 0);
  });

  it('Static mapping', () => {
    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-bar/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(true);

    jit.findPlugin('bar');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['grunt-foo', path.resolve('node_modules/grunt-foo/tasks')]);
  });

  it('Static mapping for private module', () => {
    jit.mappings = {
      foo: '@abc/grunt-foo'
    };

    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/@abc/grunt-foo/tasks')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['@abc/grunt-foo', path.resolve('node_modules/@abc/grunt-foo/tasks')]);
  });

  it('Static mapping for custom task', () => {
    jit.mappings = {
      foo: 'custom/foo.js'
    };

    existsSync.withArgs(path.resolve('node_modules/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/grunt-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('node_modules/foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('custom/foo.js')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('custom/foo.js'), true]);
  });

  it('Other node_modules dir', () => {
    jit.pluginsRoots = ['other/dir'];

    existsSync.withArgs(path.resolve('other/dir/grunt-contrib-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('other/dir/grunt-foo/tasks')).returns(false);
    existsSync.withArgs(path.resolve('other/dir/foo/tasks')).returns(true);

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('other/dir/foo/tasks')]);
  });

  it('Multiple node_modules dirs', () => {
    jit.pluginsRoots = ['one/dir', 'other/dir'];

    existsSync.withArgs(path.resolve('one/dir/bar/tasks')).returns(true);
    existsSync.withArgs(path.resolve('other/dir/foo/tasks')).returns(true);

    jit.findPlugin('bar');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['bar', path.resolve('one/dir/bar/tasks')]);

    loadPlugin.reset();

    jit.findPlugin('foo');

    assert.deepEqual(
      loadPlugin.getCall(0).args,
      ['foo', path.resolve('other/dir/foo/tasks')]);
  });
});
