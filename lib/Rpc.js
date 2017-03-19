'use strict';

var imports     = require('soop').imports();

var Globaltokencore         = require('Globaltokencore'),
    RpcClient       = Globaltokencore.RpcClient,
    GlobaltokencoreBlock    = Globaltokencore.Block,
	util            = require('util'),
    config          = require('../config/config');

var  GlobaltokencoreRpc  = imports.GlobaltokencoreRpc || new RpcClient(config.bitcoind);

function Rpc() {
}

Rpc._parseTxResult = function(info) {
  var b  = new Buffer(info.hex,'hex');

  // remove fields we dont need, to speed and adapt the information
  delete info.hex;

  // Inputs => add index + coinBase flag
  var n =0;
  info.vin.forEach(function(i) {
    i.n = n++;
    if (i.coinbase) info.isCoinBase = true;
  });

  // Outputs => add total
  var valueOutSat = 0;
  info.vout.forEach( function(o) {
    o.value = o.value.toFixed(8);
    valueOutSat += o.value * Globaltokencore.util.COIN;
  });
  info.valueOut = valueOutSat.toFixed(0) / Globaltokencore.util.COIN;
  info.size     = b.length;

  return info;
};


Rpc.errMsg = function(err) {
  var e = err;
  e.message += util.format(' [Host: %s:%d User:%s Using password:%s]',
                            GlobaltokencoreRpc.host,
                            GlobaltokencoreRpc.port,
                            GlobaltokencoreRpc.user,
                            GlobaltokencoreRpc.pass?'yes':'no'
                          );
  return e;
};

Rpc.getTxInfo = function(txid, doNotParse, cb) {
  var self = this;

  if (typeof doNotParse === 'function') {
    cb = doNotParse;
    doNotParse = false;
  }

  GlobaltokencoreRpc.getRawTransaction(txid, 1, function(err, txInfo) {
    // Not found?
    if (err && err.code === -5) return cb();
    if (err) return cb(self.errMsg(err));

    var info = doNotParse ? txInfo.result : self._parseTxResult(txInfo.result);
    return cb(null,info);
  });
};


Rpc.blockIndex = function(height, cb) {
  var self = this;

  GlobaltokencoreRpc.getBlockHash(height, function(err, bh){
    if (err) return cb(self.errMsg(err));
    cb(null, { blockHash: bh.result });
  });
};

Rpc.getBlock = function(hash, cb) {
  var self = this;

  GlobaltokencoreRpc.getBlock(hash, function(err,info) {
    // Not found?
    if (err && err.code === -5) return cb();
    if (err) return cb(self.errMsg(err));


    if (info.result.height)
      info.result.reward =  GlobaltokencoreBlock.getBlockValue(info.result.height) / Globaltokencore.util.COIN ;

    return cb(err,info.result);
  });
};

Rpc.sendRawTransaction = function(rawtx, cb) {
  GlobaltokencoreRpc.sendRawTransaction(rawtx, function(err, txid) {
    if (err) return cb(err);

    return cb(err, txid.result);
  });
};

Rpc.verifyMessage = function(address, signature, message, cb) {
  var self = this;
  GlobaltokencoreRpc.verifyMessage(address, signature, message, function(err, message) {
    if (err && (err.code === -3 || err.code === -5))
      return cb(err);  // -3 = invalid address, -5 = malformed base64 / etc.
    if (err)
      return cb(self.errMsg(err));

    return cb(err, message.result);
  });
};

module.exports = require('soop')(Rpc);


