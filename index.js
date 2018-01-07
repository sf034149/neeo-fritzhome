'use strict';

const neeoapi = require('neeo-sdk');
const controller = require('./fritzcontroller.js');

const powerSwitch = {
  name: 'power',
  label: 'Power'
};

const discoveryInstructions = {
  headerText: 'Fritz!Box discovery',
  description: 'Make sure Fritz!Box is reachable from node.js host on port 443 (HTTPS). ' +
               'NEEO will discover your Fritz!Box DECT Switch devices now. Press NEXT.'
};

const fritzbox = neeoapi.buildDevice('Fritz!Box')
  .setManufacturer('AVM')
  .addAdditionalSearchToken('DECT')
  .setType('light')
  .addSwitch(powerSwitch, {setter: controller.setPowerstate, getter: controller.getPowerstate})
  .addCapability('alwaysOn')
  .registerSubscriptionFunction(controller.registerStateUpdateCallback)
  .registerInitialiseFunction(controller.initialise)
  .enableDiscovery(discoveryInstructions, controller.discoverDevices);

console.log('-------- NEEO SDK Fritzbox adapter -------');
console.log('------------------------------------------');

function startSdkExample(brain) {
  console.log('- Start server');
  neeoapi.startServer({
    brain,
    port: 6336,
    name: 'fritzbox',
    devices: [fritzbox]
  })
  .then(() => {
    console.log('READY for NEEO to search Fritz!Box DECT Power Switches.');
  })
  .catch((error) => {
    //if there was any error, print message out to console
    console.error('ERROR!', error.message);
    process.exit(1);
  });
}

const brainIp = process.env.BRAINIP;
if (brainIp) {
  console.log('- use NEEO Brain IP from env variable', brainIp);
  startSdkExample(brainIp);
} else {
  console.log('- discover one NEEO Brain...');
  neeoapi.discoverOneBrain()
    .then((brain) => {
      console.log('- Brain discovered:', brain.name);
      startSdkExample(brain);
    });
}

module.exports = fritzbox;
