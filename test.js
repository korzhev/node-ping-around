var pingAround = require('./index');
const hostList = require('./host_list');
//var hostList = require('./dev_list');

var ping = require('net-ping');


var P1 = new pingAround(hostList, {});
P1.on('error', function() {});
P1.start();
