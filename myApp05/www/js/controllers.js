angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
})

.controller('IntroCtrl', ['$scope', '$state', '$ionicPopup', function($scope, $state, $ionicPopup) {

    $scope.step2 = {};
    $scope.step3 = {};

    $scope.start = function() {
        $state.go('app.playlists');
    };

    $scope.startCondition = function() {
        return angular.isDefined($scope.step3.something);
    };

    $scope.parts = [{
      id: 0,
      name: 'ראש וצוואר',
      image: 'img/head.png'
    }, {
      id: 1,
      name: 'עיניים',
      image: 'img/eye.png'
    }, {
      id: 2,
      name: 'אף, אוזן וגרון',
      image: 'img/ear.png'
    }, {
      id: 3,
      name: 'חזה וגב',
      image: 'img/back.png'
    }, {
      id: 4,
      name: 'זרועות וידיים',
      image: 'img/arm.png'
    }, {
      id: 5,
      name: 'בטן ואגן הירכיים',
      image: 'img/stomach.png'
    }, {
      id: 6,
      name: 'רגליים',
      image: 'img/leg.png'
    }, {
      id: 7,
      name: 'אחר',
      image: 'img/body.png'
    }];
}]);
