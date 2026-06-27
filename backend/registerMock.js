const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;
const mockPath = path.resolve(__dirname, 'config/mongooseMock.js');

Module.prototype.require = function(request) {
  if (request === 'mongoose') {
    return originalRequire.call(this, mockPath);
  }
  return originalRequire.apply(this, arguments);
};
