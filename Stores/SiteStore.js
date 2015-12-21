'use strict'

var Reflux = require("reflux");
var HostStore = require("./HostStore");
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");

// UTILITIES
var _ = require("lodash");

var LocationStore = Reflux.createStore({
	listenables: [SiteActions],
	_host: null,
	_dbRefs: [],
	_sites: {},

	init: function() {
		this.listenTo(HostStore, this._setHost, this._setHost);
	},

	getInitialState: function() {
		return { sites: this._sites }
	},

	onEndListeners: function() {
		_.each(this._dbRefs, (dbRef) => {
			dbRef.off("child_changed");
			dbRef.off("child_added");
		});
	},

	// "Getting sites" simply gets site info from within this model
	onGetEmployerSite: function(siteId) {
		SiteActions.getEmployerSite.completed(this._sites[siteId]);
	},

	onGetSite: function(siteId) {
		SiteActions.getSite.completed(this._sites[siteId]);
	},

	// "Pulling sites" extracts data from the DB
	onPullEmployerSite: function(siteId) {
		let siteRef = this._host.db.child(siteId);
		
		// add to list of other db objects for the purpose being "unlistened to" later
		this._dbRefs.push(siteRef);
		
		siteRef.once("value", (employerSite) => {
			this._sites[siteId] = employerSite.val();
			this.trigger({sites: this._sites});
			SiteActions.pullEmployerSite.completed(employerSite.val());

			// listen for DB changes to parameters of site object
			siteRef.on("child_changed", (paramRef) => {
				let employerSite = this._sites[siteId];
				employerSite[paramRef.key()] = paramRef.val();
			});
		});
	},

	onSetIssueId: function(issueId, siteId) {
		let siteIssuesRef = this._host.db.child(siteId).child("issues");
		this._dbRefs.push(siteIssuesRef);

		siteIssuesRef.transaction((prevList) => {
		  /******************************************************************
				Note: prevList represents the issues array.  Issues will be
				null in the event no issueIds exist; therefore special actions
				need to be taken in order to add the "issues" parameter before
				populating
		  ******************************************************************/
		  if (prevList === null)
		  	return "";
		  else {
		  	if (prevList === "")
		  		return [issueId];
		  	else {
		  		if ( !_.contains(prevList, issueId) )
		  			prevList.push(issueId);

		  		return prevList;
		  	}
		  }
		}, (err, commit, snapshot) => {
			if (err || !commit)
				SiteActions.setIssueId.failed(err);
			else
				SiteActions.setIssueId.completed();
		});
	},

	_setHost: function(data) {
		this._host = _.mapValues(data.host, (value, key) => {
			return (key === "db") ? value.child("sites") : value;
		});
	}
});


module.exports = LocationStore;