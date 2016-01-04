'use strict'

var Reflux = require("reflux");
var Firebase = require("firebase");

// MIXINS
var HostMixin = require("../Mixins/Host");

// ACTIONS && STORES
var HostActions = require("../Actions/HostActions");

// UTILITY LIBRARIES
var _ = require("lodash");

var HostStore = Reflux.createStore({
	listenables: [HostActions],
	mixins: [HostMixin],
	_app: "cowbell",
  _db: null,
  _env: HostMixin.getEnv(),
	_s3Policy: null,

	getInitialState: function() {
		let url = "https://" +this._app +"-" +this._env +".firebaseIO.com";
		this._db = new Firebase(url);
		
		return {
			host: {
				app: this._app,
				db: this._db,
				env: this._env
				// s3Policy: this._s3Policy
			}
		};
	},

	onGetDb: function() {
		HostActions.getDb.completed(this._db);
	},

	// onGetS3Policy: function() {
	// 	HostActions.getS3Policy.completed(this._s3Policy.data);
	// },

	// onPullUploadParams: function(creds) {
	// onPullS3Policy: function(creds) {
	// 	let source = creds.source
	// 		, query = this._urlForQuery(source.url, source.params)
	// 		// , self = this;

 //  	fetch(query, creds.params).then((res) => {
	// 		// self._host.s3Policy = {
	// 		this._s3Policy = {
	// 			data: JSON.parse(res._bodyText),
	// 			isDone: true
	// 		};

	// 		this.trigger({
	// 			host: {
	// 				app: this._app,
	// 				db: this._db,
	// 				env: this._env,
	// 				s3Policy: this._s3Policy
	// 			}
	// 		});

	// 		HostActions.pullS3Policy.completed(this._s3Policy);
	// 	}).catch((err) => {
	// 		HostActions.pullS3Policy.failed(err);
	// 	});
	// },

	_urlForQuery: function(url, params) {
		let queryString = Object.keys(params).map(key => key + "=" +encodeURIComponent(params[key])).join("&");		
		return url +queryString;
	},
});

module.exports = HostStore;