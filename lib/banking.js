
/*!
 * banking.js
 */

/**
 * [request description]
 * @type {[type]}
 */

var request = require('superagent')
  , ofx = require('./ofx')
  , pkg = require('../package')
  , util = require('./utils')
  , debug = require('debug')('banking:main');


/**
 * expose Banking
 */

module.exports = Banking;

/**
 * [Banking description]
 * @param {[type]} args [description]
 */

function Banking(args){
  if (!(this instanceof Banking)) return new Banking(args);
  this.opts = {
    fid: args.fid,
    fidOrg: args.fidOrg || '',
    url: args.url,
    bankId: args.bankId || '', /* If bank account use your bank routing number otherwise set to null */
    user: args.user,
    password: args.password,
    accId: args.accId,  /* Account Number */
    brokerId: args.brokerId, /* For investment accounts */
    accType: args.accType,
    clientId: args.clientId,
    appVer: args.appVer || '1700',
    ofxVer: args.ofxVer || '102',
    app: args.app || 'QWIN'
  };
}

/**
 * [version description]
 */

Banking.version = pkg.version;

/**
 * [parse description]
 * @param  {[type]}   str [description]
 * @param  {Function} fn  [description]
 * @return {[type]}       [description]
 */

Banking.parse = function(str, fn){
  ofx.parse(str, function (res){
    fn(res);
  });
};

/**
 * Fetches account listing from remote server
 *
 * @param {JSON} o Request Config Settings
 * @param {String} format (Options are 'xml' || 'json' if omitted defaults to 'json')
 * @param {Function} cb
 * @return {XML|JSON}
 * @api public
 */

Banking.prototype.getAccountList = function(args, fn) {
  var opts = util.mixin(this.opts, args);
  var ofxReq = ofx.createAccountListRequest(opts);

  return doRequest(this.opts.url, ofxReq, fn);
};

/**
 * Fetches Ofx String from Bank Server and parse to json or returns valid XML
 *
 * @param {JSON} o Request Config Settings
 * @param {String} format (Options are 'xml' || 'json' if omitted defaults to 'json')
 * @param {Function} cb
 * @return {XML|JSON}
 * @api public
 */

Banking.prototype.getStatement = function(args, fn) {
  var opts = util.mixin(this.opts, args);
  var ofxReq = ofx.createRequest(opts);

  return doRequest(this.opts.url, ofxReq, fn);
};

var doRequest = function(url, ofxReq, fn) {
  var req = request
    .post(url)
    .type('application/x-ofx')
    .set({'User-Agent' : 'banking-js'})
    .set({'Accept' : 'application/ofx'})
    .send(ofxReq)
    .buffer()

  if (!fn) return req;

  req
    .end(function (err, res){
      if (err) return fn(true, err);
      debug('Raw-Response:', res.text);
      if (!res.ok || res.error) return fn(true, res.text);
      ofx.parse(res.text, function(ofxObj){
        fn(false, ofxObj);
      });
    });
};
