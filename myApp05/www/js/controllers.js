var map, lat, long, marker, circle, interval;

angular.module('starter.controllers', [])
.factory('Data', function(){
    return { FirstName: '' };
})
.controller('AppCtrl', function($scope) {
})

.controller('MapController', function($scope, $http, $timeout, $cordovaGeolocation) {

  var posOptions = {timeout: 10000, enableHighAccuracy: false};
  $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (position) {
      var lat  = position.coords.latitude
      var long = position.coords.longitude
      myLatLng = {lat: lat, lng: long}
      map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        scrollwheel: true,
        zoom: 15
      });


      $http.post(url, parameter, {
              headers : {
                'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
            }
    }).
        success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          var infowindow = new google.maps.InfoWindow({
            content: "\n כרגע ישנם" + data["count"] + "אנשים\n באזורך הסובלים מאותם תסמינים "
          });

          infowindow.open(map, marker);
        }).
        error(function(error, status) {
          var infowindow = new google.maps.InfoWindow({
            content: "ERROR"
          });

          infowindow.open(map, marker);
        });

      var marker = new google.maps.Marker({
        map: map,
        position: myLatLng,
      });

      // Circle waves
      circlize(map, myLatLng);
    }, function(err) {
      // error
    });

  //

})

.controller('IntroCtrl', ['$scope', '$state', '$ionicPopup', '$http', '$cordovaGeolocation', function($scope, $state, $ionicPopup, $http, $cordovaGeolocation) {
    $scope.step1 = {};
    $scope.step2 = {};
    $scope.step3 = {};
    $scope.step4 = {};

    map = maptize($cordovaGeolocation, $scope);
    $scope.report = function(gender, age, sympId) {
      $scope.reportButton = true;
      if(confirm("דיווח מחלה, האם את/ה בטוח?")){
        myLatLng = {lat: lat, lng: long}
        marker = new google.maps.Marker({
          map: map,
          position: myLatLng,
        });
        // Circle waves
        postReport(gender, age, sympId, $http);
      }

    };
    $scope.cleanOverlays = function(){
      if(typeof circle !== "undefined")
        circle.setMap(null);
      if(typeof marker !== "undefined")
        marker.setMap(null);
      if(typeof interval !== "undefined")
        clearInterval(interval);
    }
    $http.get("http://52.38.110.193:8092/getsymptoms")
    .then(function(response) {
        $scope.relDisease = response.data;
    });

    $scope.startCondition = function() {
        return angular.isDefined($scope.step3.disease);
    };
    $scope.chosenBodyPart = 0;
    $scope.$watch('step2.bodyPart', function(value) {
       $scope.chosenBodyPart = value;
    });
    $scope.parts = [{
      id: 1,
      name: 'ראש וצוואר',
      image: 'img/head.png'
      }, {
        id: 2,
        name: 'עיניים',
        image: 'img/eye.png'
      }, {
        id: 3,
        name: 'אף, אוזן וגרון',
        image: 'img/ear.png'
      }, {
        id: 4,
        name: 'חזה וגב',
        image: 'img/back.png'
      }, {
        id: 5,
        name: 'זרועות וידיים',
        image: 'img/arm.png'
      }, {
        id: 6,
        name: 'בטן ואגן הירכיים',
        image: 'img/stomach.png'
      }, {
        id: 7,
        name: 'רגליים',
        image: 'img/leg.png'
      }, {
        id: 8,
        name: 'אחר',
        image: 'img/body.png'
      }
    ];
    // $scope.relDisease = [{
    //   id: 0,
    //   name: $scope.myWelcome
    //   }, {
    //     id: 1,
    //     name: 'B'
    //   }, {
    //     id: 2,
    //     name: 'C'
    //   }
    // ];
}]);

function maptize(cgl, $scope){
  var posOptions = {timeout: 10000, enableHighAccuracy: false};
  cgl
    .getCurrentPosition(posOptions)
    .then(function (position) {
      lat  = position.coords.latitude
      long = position.coords.longitude
      myLatLng = {lat: lat, lng: long}
      map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        scrollwheel: true,
        zoom: 15
      });
    });
  return map;
}
function postReport(gender, age, sympId, $http){
  var url = "http://52.38.110.193:8092/reports";
  var parameter = JSON.stringify(
    {
      "lat": lat,
      "lng": long,
      "gender": gender,
      "symptomId": sympId,
      "comments": "ranTest"
    }
  );

  $http.post(url, parameter, {
          headers : {
            'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
        }
}).
    success(function(data, status, headers, config) {
      // this callback will be called asynchronously
      // when the response is available
      var infowindow = new google.maps.InfoWindow({
        content: "\n כרגע ישנם" + data["count"] + "אנשים\n באזורך הסובלים מאותם תסמינים "
      });

      infowindow.open(map, marker);
    }).
    error(function(error, status) {
      var infowindow = new google.maps.InfoWindow({
        content: "ERROR"
      });

      infowindow.open(map, marker);
    });
    circlize( { lat: lat, lng: long } );

}
function circlize(myLatLng){
  fo = 0.75;
  so = 1;
  circle = new google.maps.Circle({
    strokeColor: '#FF0000',
    strokeWeight: 1,
    fillColor: '#FF0000',
    fillOpacity: fo,
    map: map,
    center: myLatLng,
    radius: 0
  });
  interval = setInterval(function() {
    maxRad = 800;
    rad = circle.getRadius();
    if(rad < maxRad){
      fo = 0.75 * ((maxRad-rad)/maxRad);
      so = 1 * ((maxRad-rad)/maxRad);
    }
    else {
      fo = 0.75;
      so = 1;
      rad = 0;
      circle.setRadius(0);
    }
    circle.setRadius(rad + 10);
    circle.setOptions({
      fillOpacity: fo,
      strokeOpacity: so,
    });
  }, 50);
}
