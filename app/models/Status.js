'use strict';
//var imports       = require('soop').imports();

var async     = require('async');
var Globaltokencore   = require('Globaltokencore');
var RpcClient = Globaltokencore.RpcClient;
var config    = require('../../config/config');
var rpc       = new RpcClient(config.bitcoind);
var bDb       = require('../../lib/BlockDb').default();

function Status() {}

Status.prototype.getBlockchainInfo = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getBlockchainInfo(function(err, bchi){
        if (err) return cb(err);

        that.info = bchi.result;
        return cb(null, {
          chain: bchi.chain,
          blocks: bchi.blocks,
          networkdifficulty: bchi.difficulty          
        });
      });
    },
  ], function (err) {
    return next(err);
  });
};

Status.prototype.getMiningInfo = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getNetworkInfo(function(err, mininginfo){
        if (err) return cb(err);

        that.info = mininginfo.result;
        return cb(null, {
          blocks: mininginfo.blocks,
          networkdifficulty: mininginfo.difficulty,
          networkhashrate: mininginfo.networkhasps
        });
      });
    },
  ], function (err) {
    return next(err);
  });
};

Status.prototype.getNetworkInfo = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getNetworkInfo(function(err, info){
        if (err) return cb(err);

        that.info = info.result;
        return cb(null, {
          version: info.version,
          protocolversion: info.protocolversion,
          timeoffset: info.timeoffset,
          connectionts: info.connections,
          networks: info.networkactive,
          proxysetting: info.networks[0].proxy,
          infoerrors: info.warnings
          });
      });
    },
  ], function (err) {
    return next(err);
  });
};

Status.prototype.getDifficulty = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getDifficulty(function(err, df){
        if (err) return cb(err);

        that.difficulty = df.result;
        return cb();
      });
    }
  ], function (err) {
    return next(err);
  });
};

Status.prototype.getTxOutSetInfo = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getTxOutSetInfo(function(err, txout){
        if (err) return cb(err);

        that.txoutsetinfo = txout.result;
        return cb();
      });
    }
  ], function (err) {
    return next(err);
  });
};

Status.prototype.getBestBlockHash = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getBestBlockHash(function(err, bbh){
        if (err) return cb(err);

        that.bestblockhash = bbh.result;
        return cb();
      });
    },

  ], function (err) {
    return next(err);
  });
};

Status.prototype.getLastBlockHash = function(next) {
  var that = this;
  bDb.getTip(function(err,tip) {
    that.syncTipHash = tip;
    async.waterfall(
      [
        function(callback){
          rpc.getBlockCount(function(err, bc){
            if (err) return callback(err);
            callback(null, bc.result);
          });
        },
        function(bc, callback){
          rpc.getBlockHash(bc, function(err, bh){
            if (err) return callback(err);
            callback(null, bh.result);
          });
        }
      ],
        function (err, result) {
          that.lastblockhash = result;
          return next();
        }
    );
  });
};

module.exports = require('soop')(Status);
