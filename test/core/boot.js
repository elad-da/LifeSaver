/**
----------------------------------------------------------------------
                          NG CLI BOOT APP
----------------------------------------------------------------------

boot.js file will start your angular app.

What's going on ?

Extends your manual dependencies
Resolve initializers
Bootstrap angular app

*/

"use strict";

var boot, bulk, initAngularApp, initializers;

// It bootstraps angular app
initAngularApp = function(hash, dependencies) {

  angular.element(document).ready(function() {
    deferredBootstrapper.bootstrap({
      element: document.body,
      module: "{@= app_name @}",
      injectorModules: dependencies,
      resolve: hash
    });

    // Requires hooks just after booting app
    return require("../app/hooks");
  });
};

initializers = '@loadInitializers';

boot = function(dependencies) {
  var app, deps, identifier, injectorDependencies, mapHash, name, objectKeys, initializers, x;
  deps = ["ngRoute"];

  // Look for additional dependencies 
  if (typeof dependencies === "object") {

    // Adding dependencies to existing deps
    deps = deps.concat(dependencies);
  }

  // Setting up angular app
  app = angular.module("{@= app_name @}", deps);

  // mapHash of sorted initializers
  mapHash = {};

  // Injector dependencies
  injectorDependencies = ["{@= app_name @}"];

  // Continue if initializers length is greater then 0
  if (typeof(initializers) !== 'undefined' && Object.keys(initializers).length > 0) {

    objectKeys = Object.keys(initializers);

    // Variable to iterate over
    x = 0;

    while (x < objectKeys.length) {

      // Grabbing current item
      identifier = objectKeys[x];

      // Getting provider name
      name = initializers[identifier].provider;

      // Setting provider name and resolve method
      mapHash[name] = initializers[identifier].resolve;

      // If initializer has dependencies , inject them too
      if (typeof initializers[identifier].dependencies !== "undefined") {

        injectorDependencies = injectorDependencies.concat(initializers[identifier].dependencies);

      }

      x++;

    }
  }
  // Finally initiating angular app
  initAngularApp(mapHash, injectorDependencies);
};

module.exports = boot;
