'use strict';
//var imports       = require('soop').imports();

var async     = require('async');
var Globaltokencore   = require('Globaltokencore');
var RpcClient = Globaltokencore.RpcClient;
var config    = require('../../config/config');
var rpc       = new RpcClient(config.bitcoind);
var bDb       = require('../../lib/BlockDb').default();

function Status() {}

Status.prototype.getBlockChainInfo = function(next) {
  var that = this;
  async.series([
    function (cb) {
      rpc.getBlockChainInfo(function(err, bchi){
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
      rpc.getNetworkInfo(function(err, mining){
        if (err) return cb(err);

        that.info = mining.result;
        return cb(null, {
          blocks: mining.blocks,
          networkdifficulty: mining.difficulty,
          networkhashrate: mining.networkhasps
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
      rpc.getInfo(function(err, info){
        if (err) return cb(err);

        that.info = info.result;
        return cb(null, {
          version: info.version,
          protocolversion: info.protocolversion,
          timeoffset: info.timeoffset,
          connectionts: info.connections,
          networks: info.networkactive,
          proxysetting: info.networks.proxy,
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
