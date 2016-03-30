const pingAround = require('./index');
const hostList = require('./host_list');

var ping = require('net-ping');
const options = {
  networkProtocol: ping.NetworkProtocol.IPv4,
  retries: 1,
  timeout: 1000
};

const P = new pingAround(hostList, 5, options);
P.on('error', console.log)
P.start();
