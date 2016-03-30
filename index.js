var util = require ('util');
var EE = require('events').EventEmitter;
var ping = require('net-ping');

function PingAround(ipList, socketPoolSize, socketOptions) {
  this.ipList = ipList;
  this._socketOptions = socketOptions || {
    networkProtocol: ping.NetworkProtocol.IPv4,
    retries: 1,
    timeout: 1000
  };
  this._startTimeout = null;
  this._socketPool = [];
  this._socketNumber = 0;
  this._startIteration = 0;
  this._nextHost = 0;
  this._socketPoolSize = socketPoolSize;
  while (this._socketNumber++ < socketPoolSize) {
    this._socketOptions.sessionId = (process.pid % 65535) + this._socketNumber;
    this._socketPool.push(ping.createSession(this._socketOptions));
  }
  //Object.freeze(this._socketOptions);
}

util.inherits(PingAround, EE);

PingAround.prototype.start = function() {
  if (this.ipList.length < this.socketPoolSize)
    this._startTimeout = setTimeout(function() {this.start()}.bind(this), 5000);

  while (this._startIteration < this._socketPool.length) {
    this._ping(this._startIteration++);
  }
  this.emit('start');
};

PingAround.prototype.stop = function() {
  this.emit('stop');
  clearTimeout(this._startTimeout);
};

PingAround.prototype._ping = function(index) {
  if (this._nextHost >= this.ipList.length) {
    this._nextHost = 0;
  }
  this._socketPool[index].pingHost(this.ipList[this._nextHost], (err, host, sent, rcvd) => {
    //console.log(nextHost, '->', err, host, rcvd - sent, 'ms');
    if (err) {
      //console.log('>>', err, host, index, this._nextHost);
      this.emit('error', err, host);
    } else {
      var ms = rcvd - sent;
      if (ms >= this._socketOptions.timeout) {
        return;
      }
      console.log(index, '->', host, ms);
      this.emit('data', ms, host);
    }
    this._nextHost++;
    this._ping(index);
  });
};

PingAround.prototype.addHost = function(ip) {
  if (Array.isArray(ip)) this.ipList = Array.prototype.concat.apply(this.ipList, ip);
  else this.ipList.push(ip);
  return this.ipList;
};

PingAround.prototype.removeHost = function(ip) {
  if (Array.isArray(ip)) {
    ip.forEach(function(item) {
      var index = this.ipList.indexOf(item);
      if (~index) this.ipList = this.ipList.slice(index, 1);
    });
  } else {
    var index = this.ipList.indexOf(ip);
    if (~index) this.ipList = this.ipList.slice(index, 1);
  }
  return this.ipList;
};

module.exports = PingAround;
