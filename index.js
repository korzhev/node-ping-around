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
  this._ipActive = [];
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
    return this._startTimeout = setTimeout(function() {this.start()}.bind(this), 5000);

  while (this._startIteration < this._socketPool.length) {
    this._ping(this._startIteration++);
  }
  this.emit('start');
};

PingAround.prototype.stop = function() {
  this.emit('stop');
  clearTimeout(this._startTimeout);
};
console.time('1');
PingAround.prototype._ping = function(index) {
  var mr = Math.floor(Math.random() * 1000);
  if (this._nextHost >= this.ipList.length) {
    return console.timeEnd('1');
    this._nextHost = 0;
  }

  if (~this._ipActive.indexOf(this.ipList[this._nextHost])) {
    this._nextHost++;
    this._ping(index);
    return;
  }

  this._ipActive.push(this.ipList[this._nextHost]);
  this._socketPool[index].pingHost(this.ipList[this._nextHost], (err, host, sent, rcvd) => {
    if (err) {
      console.log(index, '>>', err, host, mr);
      this.emit('error', err, host);
    } else {
      var ms = rcvd - sent;
      if (ms >= this._socketOptions.timeout) {
        this._disableIp(host);
        this._nextHost++;
        this._ping(index);
        return;
      }
      console.log('socket №', index, '->', host, ms + 'ms');
      this.emit('data', ms, host);
    }
    this._disableIp(host);
    this._nextHost++;
    this._ping(index);
  });

};

PingAround.prototype.addHost = function(ip) {
  if (Array.isArray(ip)) this.ipList = Array.prototype.concat.apply(this.ipList, ip);
  else this.ipList.push(ip);
  return this.ipList;
};

PingAround.prototype._disableIp = function(ip) {
  var index = this._ipActive.indexOf(ip);
  if (~index) this._ipActive.splice(index, 1);
};

PingAround.prototype.removeHost = function(ip) {
  if (Array.isArray(ip)) {
    ip.forEach(function(item) {
      var index = this.ipList.indexOf(item);
      if (~index) this.ipList = this.ipList.splice(index, 1);
    });
  } else {
    var index = this.ipList.indexOf(ip);
    if (~index) this.ipList.splice(index, 1);
  }
  return this.ipList;
};

module.exports = PingAround;
