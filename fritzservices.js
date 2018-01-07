'use strict';

const fritz = require('fritzbox.js');

//Fritz!Box credentials needs to be adpated to own needs
const options = {
  username: 'user',
  password: 'password',
  server: 'fritz.box',
  protocol: 'https'};

// Build initial deviceState from Fritz!Box
// Only devices of "Type 9" and with no SwitchLock will be taken into account
// adapt to your needs if necessary
async function buildDeviceStateObject (deviceState) {
  options.sid=undefined;
  let all_devices = await fritz.getSmartDevices(options);
  if (all_devices.error) {
    console.log('discoverDevices Error:', all_devices.error.message);
    return all_devices;
  }
    all_devices.map(function(obj){
       if (obj.switch && obj.DeviceType && obj.ID && obj.Name) {
         if (obj.switch.SwitchLock === 0 && obj.DeviceType === 9) {
           let DECTdevice = { smartdevice: obj};
           Object.defineProperty(DECTdevice,'options', {
             value:  Object.assign({}, options),
             writable: true
           });
           deviceState.addDevice(obj.ID + "-" + obj.Identifyer.replace(/ /g,"-"), DECTdevice, true);
         }
       }
    });
  console.log("Device State Object successfully build.");
  return {message: 'Device State Object successfully build.'};
  };

// get current state from Fritz!Box
async function getSmartDevices() {
    let all_devices = await fritz.getSmartDevices(options);
    if (all_devices.error && options.sid && all_devices.error.message === 'Not authenticated correctly for communication with Fritz!Box.') {
     options.sid = undefined;   // probably SID timed out, get a new one
     all_devices = await fritz.getSmartDevices(options);
    }
    if (all_devices.error) {
     console.log('getSmartDevices Error:', all_devices.error.message);
     return all_devices;
    }
    return all_devices;
  };

// set Powerstate to Fritz!Box device
async function setDevicePowerstate (deviceid, value, deviceState) {
  var options_set  = deviceState.getClientObjectIfReachable(deviceid).options;
  let id = deviceid.slice(0, deviceid.indexOf("-"));
  let state = 0;
  if (value === true || value === 'true') {
    state = 1;
  }
  let response = await fritz.toggleSwitch(id, state, options_set);
  if (response.error && options.sid && response.error.message === 'Not authenticated correctly for communication with Fritz!Box.') {
    options_set.sid = undefined;  // probably SID timed out, get a new one
    response = await fritz.toggleSwitch(id, state, options_set);
  }
  if (response.error) {
    console.log('setDevice Powerstate Error:', response.error.message);
    return response;
  }
  deviceState.getClientObjectIfReachable(deviceid).options = options_set;
  console.log("setDevicePowerstate to given state. ID: ", id);
  return { message: "setDevicePowerstate to given state", ID: id};
};

module.exports.buildDeviceStateObject = buildDeviceStateObject;
module.exports.getSmartDevices = getSmartDevices;
module.exports.setDevicePowerstate = setDevicePowerstate;
