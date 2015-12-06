'use strict'

var Reflux = require("reflux");
var HostStore = require("./HostStore");
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");

// UTILITIES
var _ = require("lodash");

var LocationStore = Reflux.createStore({
	listenables: [SiteActions],
	_db: null,
	_dbRefs: [],
	_sites: {},

	init: function() {
		this.listenTo(HostStore, this._updateDb, this._updateDb);
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
		let siteRef = this._db.child(siteId);
		
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

		

		// update current issue list when employer issue list updates
		// let issuesRef = dbRef.child("issues");
		// this._dbRefs.push(issuesRef);
		
		// requestsRef.on("child_added", (requestRef) => {
		// 	let newRequestId = requestRef.val();
		// 	RequestActions.pullRequest(newRequestId, "site");
		// })
	},

	onSetRequestId: function(requestId, siteId) {
		let siteRequestsRef = this._db.child(siteId).child("requests");
		this._dbRefs.push(siteRequestsRef);

		siteRequestsRef.transaction((prevList) => {
		  /******************************************************************
				Note: prevList represents the requests array.  Requests will be
				null in the event no requestIds exist; therefore special actions
				need to be taken in order to add the "requests" parameter before
				populating
		  ******************************************************************/
		  if (prevList === null)
		  	return "";
		  else {
		  	if (prevList === "")
		  		return [requestId];
		  	else {
		  		if ( !_.contains(prevList, requestId) )
		  			prevList.push(requestId);

		  		return prevList;
		  	}
		  }
		}, (err, commit, snapshot) => {
			if (err || !commit)
				SiteActions.setRequestId.failed(err);
			else
				SiteActions.setRequestId.completed();
		});
	},

	_updateDb: function(data) {
		this._db = data.db.child("sites");
	},
});


module.exports = LocationStore;