var util = require('util');
var EE = require('events').EventEmitter;
var ping = require('net-ping');

function PingAround(ipList, options) {
  this.ipList = ipList;
  var sockOptions = options.socketOptions || {};
  this.isActive = false;
  this._socketOptions = {
    networkProtocol: ping.NetworkProtocol[sockOptions.networkProtocol || 'IPv6'],
    retries: sockOptions.retries || 1,
    timeout: sockOptions.timeout || 1000
  };
  this._startTimeout = null;
  this._socketPool = [];
  this._ipActive = [];
  this._socketNumber = 0;
  this._startIteration = 0;
  this._currentHostIndex = 0;
  this._socketPoolSize = options.socketPoolSize || 2;
  while (this._socketNumber++ < this._socketPoolSize) {
    this._socketOptions.sessionId = (process.pid % 65535)
      + this._socketNumber
      + (options.sessionIdSalt || 0);
    this._socketPool.push(ping.createSession(this._socketOptions));
  }

  this.start = this.start.bind(this);

}

util.inherits(PingAround, EE);

PingAround.prototype.start = function paStart() {
  //var self = this;
  if (this.ipList.length < this._socketPoolSize) {
    this._startTimeout = setTimeout(this.start, 5000);
    return this;
  }
  while (this._startIteration < this._socketPool.length) {
    this._ping(this._startIteration++);
  }
  this.isActive = true;
  this.emit('start');
  return this;
};

PingAround.prototype.stop = function paStop() {
  clearTimeout(this._startTimeout);
  this.isActive = false;
  this.emit('stop');
};

PingAround.prototype._next = function paNext(host, index) {
  if (!this.ipList.length) return this.stop();
  this._disableIp(host);
  this._currentHostIndex++;
  this._ping(index);
  return this;
};

PingAround.prototype._ping = function paPing(index) {
  //var mr = Math.floor(Math.random() * 1000);
  var ms = 0;
  var self = this;
  if (this._currentHostIndex >= this.ipList.length) {
    this._currentHostIndex = 0;
  }
  var hostIndex = this._currentHostIndex;
  if (~this._ipActive.indexOf(this.ipList[hostIndex])) {
    this._currentHostIndex++;
    this._ping(index);
    return;
  }

  this._ipActive.push(this.ipList[hostIndex]);
  this._socketPool[index].pingHost(
    this.ipList[hostIndex],
    function pingHostCb(err, host, sent, rcvd) {
      if (err) {
        //console.log(self.ipList[hostIndex].retention, hostIndex)
        //console.log(index, '>>', err, host, mr);
        self.emit('error', err, host);
      } else {
        ms = rcvd - sent;
        if (ms >= self._socketOptions.timeout) {
          self._next(host, index);
          return;
        }
        //console.log('socket №', index, '-> host № ', hostIndex, host, ms + 'ms');
        self.emit('data', ms, host);
      }
      self._next(host, index);
    }
  );
};

PingAround.prototype.addHost = function paAddHost(ip) {
  if (Array.isArray(ip)) {
    this.ipList = Array.prototype.concat.apply(this.ipList, ip);
  } else {
    this.ipList.push(ip);
  }
  return this;
};

PingAround.prototype._disableIp = function paDisableIp(ip) {
  var index = this._ipActive.indexOf(ip);
  if (~index) this._ipActive.splice(index, 1);
};

PingAround.prototype.removeHost = function paRemoveHost(ip) {
  var self = this;
  var index = -1;
  if (Array.isArray(ip)) {
    ip.forEach(function removeIpArray(item) {
      index = self.ipList.indexOf(item);
      if (~index) {
        self.ipList = self.ipList.splice(index, 1);
        self._disableIp(ip);
      }
    });
  } else {
    index = self.ipList.indexOf(ip);
    if (~index) {
      self.ipList.splice(index, 1);
      self._disableIp(ip);
    }
  }
  return this;
};

module.exports = PingAround;
