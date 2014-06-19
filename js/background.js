chrome.app.runtime.onLaunched.addListener(function() {
 var options = {
   'id': 'Test Kiosk App',
   'state': 'fullscreen',
   'alwaysOnTop': true
 };

 chrome.app.window.create('application.html', (options));
});