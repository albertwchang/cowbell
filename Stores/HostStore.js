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

	initHost: function() {
		this.trigger({
			host: {
				app: this._app,
				db: this._db,
				env: this._env,
				s3Policy: this._s3Policy
			}
		});
	},

	_urlForQuery: function(url, params) {
		let queryString = Object.keys(params).map(key => key + "=" +encodeURIComponent(params[key])).join("&");		
		return url +queryString;
	},
});

module.exports = HostStore;