const pingAround = require('./index');
//const hostList = require('./host_list');
const hostList = require('./dev_list');

var ping = require('net-ping');
const options = {
  networkProtocol: ping.NetworkProtocol.IPv4,
  retries: 1,
  timeout: 1000
};

const P1 = new pingAround(hostList, 10, options);
P1.on('error', ()=>{})
P1.start();