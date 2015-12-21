'use strict'

var Reflux = require("reflux");
var HostStore = require("./HostStore");
var UserActions = require("../Actions/UserActions");

// UTILITIES
var _ = require("lodash");

var UserStore = Reflux.createStore({
	listenables: [UserActions],
	_host: null,
	_users: [],
	_storeName: "users",

	init: function() {
		this.listenTo(HostStore, this._setHost, this._setHost);
	},

	getInitialState: function() {
		return { users: this._users }
	},

	// onEndListeners: function() {

	// },

	onPullUsers: function(siteId, userIds) {
		let usersRef = this._host.db; // refers to "user" collection within DB

		if ( _.isEmpty(userIds) || !_.isEmpty(this._users[siteId]) )
			UserActions.pullUsers.completed();
		else {
			this._users[siteId] = {};

			usersRef.once("value", (snapshot) => {
				let allUsers = snapshot.val()
					, siteUsers = this._users[siteId];

				_.each(userIds, (key) => {
					siteUsers[key] = allUsers[key];
				});

				UserActions.pullUsers.completed(this._users[siteId]);
				this.trigger({users: this._users});
			});
		}
	},

	_setHost: function(data) {
		this._host = _.mapValues(data.host, (value, key) => {
			return (key === "db") ? value.child(this._storeName) : value;
		});
	},
});

module.exports = UserStore;