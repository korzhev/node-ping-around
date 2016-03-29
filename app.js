'use strict';

const ping = require('net-ping');
const options = { networkProtocol: ping.NetworkProtocol.IPv4, retries: 1, timeout: 2000 };
const hostList = require('./host_list');
const socketPoolSize = 5;
const socketPool = [];

let socketNumber = 0;
while (socketNumber++ < socketPoolSize) {
  socketPool.push(ping.createSession(options));
}

let i = 0;
let nextHost = 0;

console.time('ping');

function startThisShit(index) {
  let socketIndex = index === 5 ? 0 : index;
  if (nextHost === hostList.length) {
    // return;
    console.timeEnd('ping');
    nextHost = 0;
  }
  socketPool[socketIndex].pingHost(hostList[nextHost++], (err, host, sent, rcvd) => {
    if (err) {
      console.log('>>', err);
    } else {
      const ms = rcvd - sent;
      if (ms >= options.timeout) {
        return;
      }
      console.log(ms);
    }
    startThisShit(++socketIndex);
  });
  return true;
}

while (i < socketPool.length) {
  startThisShit(i++);
}
