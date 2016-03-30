'use strict';

const ping = require('net-ping');
const options = {networkProtocol: ping.NetworkProtocol.IPv4, retries: 1, timeout: 2000};
const hostList = require('./host_list');
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

//function pingThisShit(soketIndex, hostIndex) {
//    socketPool[index].pingHost(hostList[index], (err, host, sent, rcvd) => {
//        if (err) {
//            console.log(err);
//        } else {
//            const ms = rcvd - sent;
//            if (ms <= options.timeout) {
//                console.log(ms);
//                return;
//            }
//        }
//        pingThisShit(index);
//    });
//}
//console.time('ping');

function startThisShit(index) {
    //let socketIndex = index === 5 ? 0 : index;
    if (nextHost >= hostList.length) {
        //return console.timeEnd('ping');
        //console.log('nooooo')
        nextHost = 0;
    }
    //console.log(index, nextHost)
    socketPool[index].pingHost(hostList[nextHost], (err, host, sent, rcvd) => {
        //console.log(nextHost, '->', err, host, rcvd - sent, 'ms');
        if (err) {
            console.log('>>', err);
        } else {
            const ms = rcvd - sent;
            if (ms >= options.timeout) {
                return;
            }
            //console.log('->',err, host, ms);
        }
        startThisShit(index);
    });
    nextHost++;
}

while (i < socketPool.length) {
    startThisShit(i++);
}


//setInterval(()=>1,1000)

//socketPool[0].pingHost(hostList[0], (err, host, sent, rcvd) => {
//    console.log('>>', err);
//    if (err) {
//        console.log('>>', err);
//    } else {
//        const ms = rcvd - sent;
//        if (ms >= options.timeout) {
//            return;
//        }
//        console.log('->',host, ms);
//    }
//    //startThisShit(++socketIndex);
//});