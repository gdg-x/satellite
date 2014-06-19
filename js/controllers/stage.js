'use strict';

angular.module('gdgVizApp')
  .controller('StageCtrl', function ($rootScope, $sce, $scope, $http, $timeout, ngAudio) {

	ngAudio.play("audio/nfc.wav");

  	$scope.devices = [];
  	$scope.blackout = false;

	var foundTag = function(tag) {
  		if($rootScope.socket && $rootScope.screen.send_upstream_events) {
  			if(tag && tag instanceof Array && tag.length > 0) {
	  			console.log("Sending tag to Groundcontrol");
	  			console.log(tag);
	  			$rootScope.analyticsTracker.sendEvent("stage","send_interrupt_event", "type", "nfc");
	  			$rootScope.socket.emit("interrupt_event", { scope: $rootScope.screen.scope, type: "nfc", payload: tag[0] }, function(data) {
	  				console.log("interrupt sent.");
	  				console.log(data);
	  			});
  			}
  		}
  	};


  	var webview = document.getElementById('viz');
	console.log('got webview:', webview);

	webview.addEventListener('exit', function(e) {
	  if (e.reason === 'crash') {
	    webview.src = 'data:text/plain,I haz crashed\nGoodbye, world!';
	  }
	});

	$scope.initialLoad = false;

	var onMessage = function(event) {

		if(event.data.type == "log") {
			console.log("Viz Log: "+event.data.payload);
		} else if(event.data.type == "finished") {
			console.log("Viz has notified us that it finished. Get the next one");
			$scope.blackout = false;
			$rootScope.socket.emit("finished_viz", {});
		} else if(event.data.type == "persistent") {
			$rootScope.socket.emit("persistent", event.data.payload, function(data) {
				webview.contentWindow.postMessage({
					type: 'persistent_response',
					payload: data
				}, '*');
			})
		} else {
			console.log('window received message:', event.data);
		}
	};

	webview.addEventListener("loadstop", function(event) {

		console.log("loadstop");
		if($scope.currentViz && !$scope.initialLoad) {

			window.removeEventListener("message", onMessage);
			window.addEventListener("message", onMessage);

			webview.executeScript({ file: "js/webview_cs.js" }, function() {
				console.log("ContentScript injected");
			})
			$scope.$apply(function() {
				$scope.initialLoad = true;

				$timeout(function() {
					$scope.blackout = true;
				}, 1200);
				
			});

			if($scope.currentViz.interrupt) {
				// Interrupt event
				webview.contentWindow.postMessage({
					type: 'start',
					payload: angular.extend($scope.currentViz.interrupt, JSON.parse($scope.currentViz.visualization.params))
				}, '*');
				console.log("Initialized Interrupt Viz");
				$rootScope.analyticsTracker.sendEvent("stage","play_interrupt_viz", "visualization_id", ""+$scope.currentViz.visualization._id);
			} else {
				webview.contentWindow.postMessage({
					type: 'start',
					payload: JSON.parse($scope.currentViz.params)
				}, '*');
				console.log("Initialized Viz");
				$rootScope.analyticsTracker.sendEvent("stage","play_viz", "visualization_id", ""+$scope.currentViz._id);
			}
		}

	});

	var readTags = function(device, cb) {
  		console.log("poll nfc");
  		chrome.nfc.read(device, { timeout: 2000 }, function(type, ndef) {
  			console.log("nfc,cb");
  			if(ndef) {
			    console.log('Found ' + ndef.ndef.length + ' NFC Tag(s)');
			    if(ndef.ndef.length > 0) {
			    	ngAudio.play("audio/nfc.wav");
			    	cb(ndef.ndef);
				}
			}
			$timeout(function() { readTags(device, cb) }, 1200);
		  });
  	}

	var deviceFound = function (devices) {
	  $scope.devices = devices;
	  if ($scope.devices.length > 0) {	    
	    for(var i = 0; i < $scope.devices.length; i++) {
		  	readTags($scope.devices[i], foundTag);
	  	}

	  } else {
	    console.log("Permission denied.");
	  }
	};

	if($rootScope.screen.send_upstream_events) {
		console.log("Enabling NFC readers...");
		chrome.nfc.findDevices(function(devices) {
		  console.log("Found " + devices.length + " NFC device(s)");
		  for (var i = 0; i < devices.length; i++) {
		    var device = devices[i];
		    console.log(device.vendorId, device.productId);
		  }
		  $rootScope.analyticsTracker.sendEvent("event_input","activated_nfc_readers", "devices", devices.length);
		  deviceFound(devices);
		});
	}

	$scope.connectSocket = function() {
		$rootScope.socket = io.connect('http://groundcontrol.gdgx.io:8000');
		$rootScope.analyticsTracker.sendEvent("connection","connected_to_groundcontrol");

		$rootScope.socket.on('blackout', function (data) {
			$scope.$apply(function() {
				$scope.blackout = false;
			});
		});

		$rootScope.socket.on('play', function (data) {
			$scope.$apply(function() {
	    		console.log(data);
	    		$scope.currentViz = data;
	    		$scope.initialLoad = false;
	    		webview.src = data.visualization.url;
    		});
  		});

		if($rootScope.screen.handle_interrupts) {
	  		$rootScope.socket.on('interrupt', function (data) {
				$scope.$apply(function() {
		    		console.log(data);
		    		$scope.currentViz = data;
		    		$scope.initialLoad = false;
		    		webview.src = data.visualization.visualization.url;
	    		});
	  		});
  		}
	};

	$http.post("https://groundcontrol.gdgx.io/signin/satellite",
		{ 	group_code: $rootScope.screen.group_code,
			handle_interrupts: $rootScope.screen.handle_interrupts,
			send_upstream_events: $rootScope.screen.send_upstream_events,
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