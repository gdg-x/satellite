'use strict';

angular.module('gdgVizApp')
  .controller('StartupCtrl', function ($rootScope, $location, $scope, $http, $timeout) {
  	console.log("StartupCtrl()");

  	$scope.screen = {};

  	$http.get("https://groundcontrol.gdgx.io/api/v1/campaigns").success(function(data) {
  		$scope.campaigns = data.items;
  	});

	$scope.login = function() {
		chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
		 	// Use the token.
		  	if(token) {
	  			$http.get("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="+ token).success(function(data) {

	  				if(data.audience == "487571729383-4lm2hakb65g76qrb0oc17s9t6d91nl7v.apps.googleusercontent.com" && data.user_id) {
	  					console.log(data);
	  					$http.get("https://www.googleapis.com/plus/v1/people/"+ data.user_id+"?key=AIzaSyDSDbyVQzkszEyCT-5UcPWqWmt93kmt-Tw").success(function(userInfo) {
	  						$rootScope.analyticsTracker.sendEvent("auth","signed_in");
	  						$rootScope.user.logged_in = true;
	  						$rootScope.user.token = token;
	  						$rootScope.user.info = userInfo;
							$rootScope.$broadcast("logged-in", $rootScope.user);
	  					});
	  				}
	  			});
			} else {
				alert("Token missing!");
			}
		});
	}

	$scope.connectPhotobooth = function() {
		$rootScope.screen = $scope.screen;
		console.log($scope.screen);
		$location.url('/photobooth');
	};

	$scope.connect = function() {
		$rootScope.screen = $scope.screen;
		console.log($scope.screen);
		$location.url('/stage');
	};

  });