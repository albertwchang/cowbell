'use strict'

var Reflux = require("reflux");

// MIXINS
var HostMixin = require("../Mixins/Host");
var StorageMixin = require("../Mixins/Storage");

// STORES && ACTIONS
var HostActions = require("../Actions/HostActions");
var HostStore = require("./HostStore");
var LookupActions = require("../Actions/LookupActions");
var ProfileActions = require("../Actions/ProfileActions");
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");
var UserActions = require("../Actions/UserActions");

// UTILITIES
var _ = require("lodash");

var ProfileStore = Reflux.createStore({
	listenables: [ProfileActions],
	mixins: [HostMixin, StorageMixin],
	_currentSiteRight: null,
	_currentUser: null,
	_dbRefs: [],
	_host: null,
	_storeName: "auth",

	init: function() {
		this.listenTo(HostStore, this._setHost, this._setHost);
	},

	getInitialState: function() {
		return {
			currentSiteRight: this._currentSiteRight,
			currentUser: this._currentUser
		}
	},

	onChangePwd: function(email, oldPwd, newPwd) {
		this._host.db.changePassword({
		  email: email,
		  oldPassword: oldPwd,
		  newPassword: newPwd
		}, function(error) {
		  if (error) {
		    switch (error.code) {
		      case "INVALID_PASSWORD":
		        console.log("Wrong password, buddy");
		        break;
		      case "INVALID_USER":
		        console.log("Apparently you don't exist");
		        break;
		      default:
		        console.log("Error changing password:", error);
		    }
		  } else {
		    console.log("User password changed successfully!");
		  }
		});
	},

	onGetLocalAuth: function() {
		let callbacks = ProfileActions.getLocalAuth
			, host = this._host;
		
		this.getLocalDb(host.app, host.env).then((db) => {
			this.getStoredModel(db, this._storeName).then((authRow) => {
				if ( _.isEmpty(authRow) )
					callbacks.failed();	
				else {
	      	let results = authRow[0].data;
	      	
	      	if (!results)
	      		callbacks.failed();	
			  	else
			  		callbacks.completed(JSON.parse(results));
			  }
			}).catch((err) => {
				console.log("A table for your app does not exist: ", host.app);
				callbacks.failed();
			});
		});
	},

	onRemoveIssueId: function(userId) {
		let userStateRef = this._host.db.child(userId).child("state").child("issueId");

		userStateRef.set("", (err) => {
			if (err)
				ProfileActions.removeIssueId.failed(err);
			else {
				ProfileActions.removeIssueId.completed();
			}
		});
	},

	onSetCurrentUser: function(authData) {
		let uid = authData.uid
			, host = this._host
			, userRef = host.db.orderByChild("uids/" +host.env).equalTo(uid);
		
		this._dbRefs.push(userRef);
		this.getLocalDb(host.app, host.env).then((db) => {
			// this.getStoreModel() is from the HostMixin
			this.getStoredModel(db, this._storeName).then((authRow) => {
				let authObj = {
		      "data": JSON.stringify(authData),
		      "key": this._storeName,
		    };

			  this.setStoredModel(db, authRow, authObj);
			});

			userRef.once("value", (result) => {
				let users = _.toArray(result.val())
					 , user = (users.length > 0) ? _.first(users) : null;
				
				this._setProfile(user);
				ProfileActions.setCurrentUser.completed();
				
				userRef.on("child_changed", (result) => {
					let user = result.val();
					this._setProfile(user);
				}, (err) => {
					console.log(err);
					return err;
				});
			}, (err) => {
				console.log(err);
				ProfileActions.setCurrentUser.failed();
			});
		});
	},

	onSetFilter: function(states) {
		let params = "settings/filters/statuses/states";
		this._currentUser.settings.filters.statuses.states = states;
		this.trigger({
			currentUser: this._currentUser,
			currentSiteRight: this._currentSiteRight
		});

		let dbRef = this._host.db.child(this._currentUser.iid).child(params);
		
		dbRef.update(states, (err) => {
			if (err)
				ProfileActions.setFilter.failed();
			else
				ProfileActions.setFilter.completed();
		});
	},

	onSetIssueId: function(issueId, userId) {
		let userStateRef = this._host.db.child(userId).child("state").child("issueId");

		userStateRef.set(issueId, (err) => {
			if (err)
				ProfileActions.setIssueId.failed(err);
			else
				ProfileActions.setIssueId.completed();
		});
	},

	onSetChosenSiteRight: function(siteRight) {
		let userId = this._currentUser.iid;
		let userRef = this._host.db.child(userId);

		userRef.child("settings").child("chosen").update({"siteId": siteRight.siteId}, (err) => {
			if (err)
				ProfileActions.setChosenSiteRight.failed(err);
			else
				ProfileActions.setChosenSiteRight.completed();
		});
	},

	onLogoutUser: function() {
		let host = this._host;
		host.db.unauth();

		this.getLocalDb(host.app, host.env).then((db) => {
			this.getStoredModel(db, this._storeName).then((profileRow) => {
				let profileObj = {"data": null, "key": this._storeName};
				
	      this.setStoredModel(db, profileRow, profileObj);
				this.trigger({currentUser: this._currentUser = null});
				this._endAllListeners();
				ProfileActions.logoutUser.completed();
			});
		});
	},

	_endAllListeners: function() {
		_.each(this._dbRefs, (dbRef) => {
			dbRef.off("child_changed");
			dbRef.off("child_added");
		});

		this._currentSiteRight = null;
		this._currentUser = null;
		
		LookupActions.endListeners();
		IssueActions.endListeners();
		SiteActions.endListeners();
		UserActions.endListeners();
	},

	_parseUid: function(iid) {
		return parseInt( iid.substr(iid.lastIndexOf(':') + 1) );
	},

	_getSiteRight: function(setSiteId) {
		let allSiteRights = this._currentUser.siteRights;

		if ( _.isEmpty(allSiteRights) )
			return null;
		else {
			// find suitable sight right or a default site right
			let chosenSiteRight = _.isEmpty(setSiteId)
				? _.first(allSiteRights)
				: _.findWhere(allSiteRights, {"siteId": setSiteId});

	    if ( !_.isEmpty(chosenSiteRight) )
	      ProfileActions.setChosenSiteRight(chosenSiteRight);

	    return chosenSiteRight;
		}
	},

	_setProfile: function(user) {
		// 1a. Check user's settings for preferred orgTypeId/SiteId combination
		let setSiteId = _.result(user, ["settings", "chosen", "siteId"]);
		this._currentUser = user;
		this._currentSiteRight = this._getSiteRight(setSiteId);
		this.trigger({
			currentUser: this._currentUser,
			currentSiteRight: this._currentSiteRight
		});
	},

	_setHost: function(data) {
		this._host = _.mapValues(data.host, (value, key) => {
			return (key === "db") ? value.child("users") : value;
		});
	}
})

module.exports = ProfileStore;