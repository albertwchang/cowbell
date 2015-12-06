'use strict'

var Reflux = require("reflux");
var Firebase = require("firebase");

// ACTIONS && STORES
var HostActions = require("../Actions/HostActions");

// UTILITY LIBRARIES
var _ = require("lodash");

var HostStore = Reflux.createStore({
	listenables: [HostActions],
	_hosts: {
		db: new Firebase("https://cowbell.firebaseIO.com")
	},
	_s3Policy: null,

	getInitialState: function() {
		return {
			db: this._hosts.db,
			images: this._hosts.images,
			s3Policy: {
				data: undefined,
				isDone: false,
			},
		}
	},

	onGetDb: function() {
		HostActions.getDb.completed(this._hosts.db);
	},

	onGetS3Policy: function() {
		HostActions.getS3Policy.completed(this._s3Policy.data);
	},

	onPullS3Policy: function(creds) {
		let source = creds.source
			, query = this._urlForQuery(source.url, source.params)
			, self = this;

  	fetch(query, creds.params)
			.then((res) => {
				self._s3Policy = {
					data: JSON.parse(res._bodyText),
					isDone: true,
				};

				self.trigger({
					db: self._hosts.db,
					images: self._hosts.images,
					s3Policy: self._s3Policy
				});

				HostActions.pullS3Policy.completed(self._s3Policy);
			}).catch((err) => {
				HostActions.pullS3Policy.failed(err);
			});
	},

	_urlForQuery: function(url, params) {
		var queryString = Object.keys(params).map(key => key + "=" +encodeURIComponent(params[key])).join("&");		
		return url +queryString;
	},
})

module.exports = HostStore;