'use strict';

const ping = require('net-ping');
const options = {networkProtocol: ping.NetworkProtocol.IPv4, retries: 1, timeout: 2000};
const hostList = [
  "10.76.100.240",
  "10.44.9.116",
  "10.44.9.1"
];
const socketPoolSize = 5;
const socketPool = [];

let socketNumber = 0;
while (socketNumber++ < socketPoolSize) {
  options.sessionId = (process.pid % 65535) + socketNumber;
  console.log(options.sessionId);
  socketPool.push(ping.createSession(options));
}

let i = 0;
let nextHost = 0;
function run() {

  socketPool[0].pingHost(hostList[0], (err, host, sent, rcvd) => {
      if (err) {
          console.log('0>>', err);
      } else {
          const ms = rcvd - sent;
          if (ms >= options.timeout) {
              return;
          }
          console.log('0->',host, ms);
        socketPool[0].pingHost(hostList[1], (err, host, sent, rcvd) => {
          if (err) {
            console.log('1>>', err);
          } else {
            const ms = rcvd - sent;
            if (ms >= options.timeout) {
              return;
            }
            console.log('1->',host, ms);
          }
          run();
          //startThisShit(++socketIndex);
        });
      }
      //startThisShit(++socketIndex);
  });

}

run();