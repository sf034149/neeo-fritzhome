
'use strict';

const neeoapi = require('neeo-sdk');
const services = require('./fritzservices.js');

const DEVICE_POLL_TIME_MS = 60000;
const COMPONENT_POWER = 'power';

// Initialize functions and variables
const deviceState = neeoapi.buildDeviceState();
let pollingIntervalId;
let updateSwitchFunction = () => { console.log('UPDATESTATUS FUNCTION NOT INITIALIZED'); };

function sendSwitchUpdate(uniqueDeviceId, component, value) {
  updateSwitchFunction({uniqueDeviceId, component, value })
    .catch((error) => {
    - console.log('NOTIFICATION_FAILED', error.message);
    });
  };

// getPowestate from deviceState
module.exports.getPowerstate = function (deviceid) {
    console.log("getPowerState called with ID: " + deviceid);
    let DECTdevice = deviceState.getClientObjectIfReachable(deviceid);
    if (!DECTdevice) {
      console.log("getPowerState Error", 'Device not reachable');
      return {error: {message: 'Device not reachable.', deviceid: deviceid}};
    }
    let state = DECTdevice.smartdevice.switch.SwitchOn;
    if (state === undefined) {
     return {error: {message: 'Device SwitchOn not defined.', deviceid: deviceid}};
    }
    console.log("getPowerstate returned: ", !!state);
    return !!state;
  };

// setPowerstate to deviceState and Fritz!Box
module.exports.setPowerstate =  async function(deviceid, value) {
    console.log("start Powerstate switch.");
    var state = 0;
    if (value === true || value === 'true') {
      state = 1;
    }
    let DECTdevice = deviceState.getClientObjectIfReachable(deviceid);
    if (!DECTdevice) {
      console.log("setPowerstate Error: ", 'Device not reachable.');
      return {error: {message: 'Device not reachable.', deviceid: deviceid}};
    }
    let current_state = DECTdevice.smartdevice.switch.SwitchOn;
    if (current_state === undefined) {
     console.log("setPowerstate Error: ", 'Device SwitchOn no defined.');
     return {error: {message: 'Device SwitchOn no defined.', deviceid: deviceid}};
    }
    if (current_state === state) {
      console.log('Powerstate is already in given state.');
      return {message: 'Powerstate is already in given state.', deviceid: deviceid};
      } else {
      const result = await services.setDevicePowerstate(deviceid, value, deviceState);
      if (result.error) {
        console.log('ERROR Powerstate could not be set.');
        return result;
      } else {
      DECTdevice.smartdevice.switch.SwitchOn = state;
      console.log('Powerstate set to given state.', 'Deviceid: ', deviceid);
      return {message: 'Powerstate set to given state.', deviceid: deviceid};
      }
    }
  };

// discover Devices from deviceState
module.exports.discoverDevices = function() {
    const allDevices = deviceState.getAllDevices();
    const returned_devices = allDevices
      .map((deviceEntry) => {
        return {
          id: deviceEntry.id,
          name: deviceEntry.clientObject.smartdevice.Name,
          reachable: deviceEntry.reachable
        };
      });
    return returned_devices;
  };

// Update deviceStates: get current state from Fritz!Box and update
// deviceState and switch.
async function UpdateDeviceStates() {
    const all_devices = await services.getSmartDevices();
    if (all_devices.error) {
      console.log('getDeviceStates Error:', all_devices.error.message);
      return all_devices;
    }
    deviceState.getAllDevices().forEach( (DECTdevice) => {
      if (DECTdevice.reachable) {
        var id = DECTdevice.id.slice(0, DECTdevice.id.indexOf("-"));
        let found_device = all_devices.find(function(obj){return obj.ID === parseInt(id);});
        if (!found_device) {
          return  {error: {message: "Device not found for state update.", ID: id}};
        }
        let state = found_device.switch.SwitchOn;
        if (DECTdevice.clientObject.smartdevice.switch.SwitchOn !== state) {
         sendSwitchUpdate(DECTdevice.id, COMPONENT_POWER, !!state);
        }
        deviceState.getClientObjectIfReachable(DECTdevice.id).smartdevice =  found_device;
        console.log("Updated ID: " + DECTdevice.id);
      }
    });
  };

module.exports.registerStateUpdateCallback = function(updateFunction) {
    updateSwitchFunction = updateFunction;
  };

module.exports.initialise = async function() {
    if (pollingIntervalId) {
      return false;
    }
    const result = await services.buildDeviceStateObject(deviceState);
    if (result.error) {
      return result;
    }
    deviceState.getAllDevices().forEach( (DECTdevice) => {
      if (DECTdevice.reachable) {
        let state = DECTdevice.clientObject.smartdevice.switch.SwitchOn;
        sendSwitchUpdate(DECTdevice.id, COMPONENT_POWER, !!state);
      }
    });
    pollingIntervalId = setInterval(UpdateDeviceStates, DEVICE_POLL_TIME_MS);
  };
