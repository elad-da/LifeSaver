angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {
})

.controller('MapController', function($scope, $ionicLoading) {
  myLatLng = {lat: 32.086027, lng: 34.7769007}
  var map = new google.maps.Map(document.getElementById('map'), {
    center: myLatLng,
    scrollwheel: true,
    zoom: 15
  });

  var marker = new google.maps.Marker({
    map: map,
    position: myLatLng,
  });

  var infowindow = new google.maps.InfoWindow({
    content: 'ישנם 4 אנשים נוספים באזורך'
  });

  infowindow.open(map, marker);

  var rectangle = new google.maps.Rectangle({
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    map: map,
    bounds: {
      north: myLatLng.lat + 0.0035,
      south: myLatLng.lat - 0.0035,
      east: myLatLng.lng + 0.0035,
      west: myLatLng.lng - 0.0035
    }
  });
  //
  // var circle = new google.maps.Circle({
  //   strokeColor: '#FF0000',
  //   strokeOpacity: 0.8,
  //   strokeWeight: 2,
  //   fillColor: '#FF0000',
  //   fillOpacity: 0.35,
  //   map: map,
  //   center: myLatLng,
  //   radius: 300
  // });
})

.controller('IntroCtrl', ['$scope', '$state', '$ionicPopup', function($scope, $state, $ionicPopup) {
    $scope.step2 = {};
    $scope.step3 = {};

    $scope.start = function() {
        $state.go('app.playlists');
    };

    $scope.startCondition = function() {
        return angular.isDefined($scope.step3.disease);
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
      }
    ];
    $scope.relDisease = [{
      id: 0,
      name: 'A'
      }, {
        id: 1,
        name: 'B'
      }, {
        id: 2,
        name: 'C'
      }
    ];
}]);
