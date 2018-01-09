var iotf = require('ibmiotf');
var config = require(__dirname + '/public/config/device.json');

var rebootedSupported = true;
var factoryResetSupported = true;
var deviceInfo = {
		'fwVersion' :1	
};

var deviceClient = new iotf.IotfManagedDevice(config);

//setting the log level to trace. By default its 'warn'
deviceClient.log.setLevel('debug');

deviceClient.connect();

deviceClient.on('connect', function(){
	var rc = deviceClient.manage(4000,false, true);
	console.log("rc ="+rc);
    deviceClient.publish('myevt', 'json', '{"hello":"world"}', 0);
    deviceClient.updateLocation(77.598838,12.96829);

    //deviceClient.disconnect();
});


deviceClient.on('firmwareDownload', function(request){
  console.log('Action : ' + JSON.stringify(request));

  deviceClient.changeState(deviceClient.FIRMWARESTATE.DOWNLOADING);

  console.log("Device firmware being downloaded");  
  
  setTimeout(function(){ 
  	deviceClient.changeState(deviceClient.FIRMWARESTATE.DOWNLOADED);
  }, 5000);
  
  deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.ACCEPTED, "Firmware download complete");

});

deviceClient.on('firmwareUpdate', function(request){
  console.log('Action : ' + JSON.stringify(request));

  deviceClient.changeUpdateState(deviceClient.FIRMWAREUPDATESTATE.IN_PROGRESS);

  console.log("Device firmware being updated");
  //Update the firmware

  setTimeout(function(){ 
  	deviceClient.changeUpdateState(deviceClient.FIRMWAREUPDATESTATE.SUCCESS);
  	deviceClient.changeState(deviceClient.FIRMWARESTATE.IDLE);
  }, 5000);
  
  deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.ACCEPTED, "Firmware update complete");

});

deviceClient.on('dmAction', function(request){
  console.log('Action : '+request.action);
  if(deviceClient.isRebootAction(request)) {
	    try {
	      //perform reboot
	      if(!rebootedSupported) {
	        deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.FUNCTION_NOT_SUPPORTED,"Reboot not supported");
	        return;
	      }
	      console.log("Initiating reboot...");
	      //process.reboot(1); 
	      console.log("Reboot complete...");
	      //inform the IoT platform know that reboot is initiated immediately.
	      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.ACCEPTED,"Reboot complete");
	    } catch(e) {
	      //inform the IoT platform know that reboot has failed.
	      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.INTERNAL_ERROR,"Cannot do reboot now : "+e);
	    }
	  } else if(deviceClient.isFactoryResetAction(request)) {
	    try {
	      //perform Factory Reset
	      if(!factoryResetSupported) {
	        deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.FUNCTION_NOT_SUPPORTED,"Factory reset not supported");
	        return;
	      }
	      console.log("Initiating factory reset...");
	      //process.fact_reset(1); 
	      console.log("Factory reset complete now...");
	      //inform the IoT platform know that factory reset is initiated immediately.
	      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.ACCEPTED, "Factory reset complete");
	    } catch(e) {
	      //inform the IoT platform know that factory reset has failed.
	      deviceClient.respondDeviceAction(request,deviceClient.RESPONSECODE.INTERNAL_ERROR,"Cannot do factory reset now : "+e);
	    }
	}
});

deviceClient.on('disconnect', function(){
  console.log('Disconnected from IoTF');
});

deviceClient.on('error', function (argument) {
	console.log(argument);
	process.exit(1);
});
