'use strict';

angular.module('gdgVizApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngAudio'
])
  .config(function ($routeProvider, $compileProvider, $locationProvider) {
  	$locationProvider.html5Mode(true);
  	$routeProvider
      .when('/', {
        templateUrl: 'partials/startup.html',
        controller: 'StartupCtrl'
      }).when('/stage', {
        templateUrl: 'partials/stage.html',
        controller: 'StageCtrl'
      }).when('/photobooth', {
        templateUrl: 'partials/photobooth.html',
        controller: 'PhotoboothCtrl'
      }).otherwise({
        redirectTo: '/'
      });
	  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
  })
  .run(function ($rootScope, $location, $http, $window) {
    $rootScope.user = {
      logged_in: false
    };

    // You'll usually only ever have to create one service instance.
    $rootScope.analytics = analytics.getService('ice_cream_app');

    // You can create as many trackers as you want. Each tracker has its own state
    // independent of other tracker instances.
    $rootScope.analyticsTracker = $rootScope.analytics.getTracker('UA-42015512-6');

    $rootScope.analyticsTracker.sendAppView('/');

    $rootScope.$on("$routeChangeStart", function (event, next, current) {
      if(next.$$route) {
        $rootScope.analyticsTracker.sendAppView(next.$$route.originalPath);
      }
    });

  	angular.element(document.querySelector('webview')).bind('permissionrequest', function(e) {
  	  if ( e.permission === 'geolocation' || e.permission === "media") {
        console.log('Allowed permission '+ e.permission + ' requested by webview');
  	    e.request.allow();
  	  } else {
  	    console.log('Denied permission '+e.permission+' requested by webview');
  	    e.request.deny();
  	  }
  	});
  });