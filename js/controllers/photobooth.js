'use strict';

angular.module('gdgVizApp')
  .controller('PhotoboothCtrl', function ($rootScope, $sce, $scope, $http, $timeout, ngAudio) {

  	$scope.countdown_visible = false;

  	navigator.webkitGetUserMedia({audio: false, video: {
  		mandatory: {
      		minWidth: 1280,
      		minHeight: 720
    	}
  	}}, function(stream) {
	    document.querySelector('video').src = webkitURL.createObjectURL(stream);
	  }, function(e) {
	    console.error(e);
	  });

  	$scope.snapshot = function() {

  		var i = 3;
  		$scope.countdown_visible = true;

  		var countfn = function() {
  			if(i > 0) {
  				ngAudio.play("audio/beep.wav");
  				$scope.countdown = i;
  			} else if(i == 0) {
  				ngAudio.play("audio/longbeep.wav");
  				$scope.countdown = "Smile!";
  			} else {
  				$scope.flash = true;
  				$timeout(function() {
  					$scope.flash = false;	
  				}, 200);
  				ngAudio.play("audio/shutter.wav");
  				var video = document.querySelector("video");
				var canvas = document.querySelector("canvas");
				var ctx = canvas.getContext("2d");
				canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
				ctx.drawImage(video, 0, 0);
				$scope.preview = true;
  				console.log("snap");
  			}
  			i--;

  			if(i >= -1)
  				$timeout(countfn, 1100);
  		}
  		countfn();
  	};

  	$scope.sendPhoto = function() {
  		$scope.load = true;

  		if($rootScope.socket) {
  			var canvas = document.querySelector("canvas");
  			$rootScope.socket.emit("persistent", {
  				scope: $rootScope.screen.scope,
  				cmd: "put_blob_collection",
  				key: "photobooth",
  				value: canvas.toDataURL('image/webp')
  			}, function (data) {
  				$scope.$apply(function() {
  					$rootScope.analyticsTracker.sendEvent("photobooth","took_picture");
  					console.log(data);

	  				$scope.load = false;
	  				$scope.preview = false;
	  				$scope.countdown_visible = false;
  				});
  			})
  		}
  	}

  	$scope.abort = function() {
  		$scope.preview = false;
  		$scope.countdown_visible = false;
  	}

  	$scope.connectSocket = function() {
		$rootScope.socket = io.connect('http://groundcontrol.gdgx.io:8000');
		$rootScope.analyticsTracker.sendEvent("connection","connected_to_groundcontrol");
	};

	$http.post("https://groundcontrol.gdgx.io/signin/satellite",
		{ 	group_code: $rootScope.screen.group_code,
			handle_interrupts: false,
			send_upstream_events: true,
			campaign_id: $rootScope.screen.campaign_id,
      friendly_name: $rootScope.screen.friendly_name,
			token: $rootScope.user.token
		}).success(function(data, status) {
	    	if(data.msg == "ok") {
	    		$rootScope.analyticsTracker.sendEvent("auth","screen_signin", "campaign_id", $rootScope.screen.campaign_id);
	    		$rootScope.screen.screen_id = data.screen_id;
	    		$scope.connectSocket();
	    	}
	    }).
	    error(function(data, status) {
	      $scope.data = data || "Request failed";
	      $scope.status = status;
	  	});

  });