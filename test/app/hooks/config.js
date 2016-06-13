"use strict";

var routeMap;

routeMap = require("../routes.js");

module.exports = /* @ngInject */ function($routeProvider, $locationProvider) {
  angular.forEach(routeMap, function(route) {
    var url;
    if (typeof route.otherwise !== "undefined") {
      $routeProvider.otherwise({
        redirectTo: route.otherwise
      });
    } else {
      url = route.url;
      delete route.url;
      $routeProvider.when(url, route);
    }
  });
};

