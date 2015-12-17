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
	_host: _.assign({ app: "cowbell"}, HostMixin.getHost()),
	_s3Policy: null,

	getInitialState: function() {
		// let state = _.assign(this.getHost(), {
		// 	images: this._hosts.images,
		// 	s3Policy: {
		// 		data: undefined,
		// 		isDone: false
		// 	}
		// });
		return { host: this._host };
	},

	onGetDb: function() {
		HostActions.getDb.completed(this._host.db);
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

				let info = _.assign(this._host, {
					// images: self._hosts.images,
					s3Policy: self._s3Policy
				});

				self.trigger(info);

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