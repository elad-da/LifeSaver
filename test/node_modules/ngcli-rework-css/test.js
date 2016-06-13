/**
  Run node test.js , to test your addon
*/
var runner = require("ng-runner");
var module = require("./index");
runner.registerCommands(module);
