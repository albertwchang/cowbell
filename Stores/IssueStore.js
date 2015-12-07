'use strict'

var Reflux = require("reflux");
var LookupStore = require("./LookupStore");
var NativeModules = require("react-native").NativeModules;
var HostActions = require("../Actions/HostActions");
var HostStore = require("./HostStore");
var IssueActions = require("../Actions/IssueActions");
var LocationActions = require("../Actions/LocationActions");
var ProfileActions = require("../Actions/ProfileActions");
var ProfileStore = require("./ProfileStore");
var SiteActions = require("../Actions/SiteActions");
var SiteStore = require("./SiteStore");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");

// UTILITIES
var Async = require("async");
var Defer = require("promise-defer");
var Moment = require('moment');
var _ = require("lodash");

var IssueStore = Reflux.createStore({
	listenables: [IssueActions],
	mixins: [IssueMixin, SiteMixin],
	_currentUser: null,
	_currentSiteRight: null,
	_db: null,
	_dbRefs: [],
	_images: null,
	_imgTemplates: null,
	_lookups: null,
	_issues: new Array(2),
	_sites: null,
	_s3Policy: null,

	/*************************************************************************
		Currently, "all" = summary list, "user" = issues pertaining to single
		user.  Although, "site" would be more appropriate than "all".
	*************************************************************************/

	init: function() {
		this.listenTo(HostStore, this._updateHost, this._updateHost);
		this.listenTo(LookupStore, this._setLookups, this._setLookups);
		this.listenTo(ProfileStore, this._setProfile, this._setProfile);
		this.listenTo(SiteStore, this._setSites, this._setSites);
		
		this._issues["site"] = null;
		this._issues["user"] = null;
	},

	getInitialState: function() {
		return {
			issues: this._issues,
		}
	},

	_assignIssue: function(issueRef, perspective) {
		let issueId = issueRef.key();
		let issue = issueRef.val();
		let existingissues = this._issues[perspective]; // issues is NOT an array!!!
		
		if ( existingIssues[issueId] && !_.eq(existingIssues[issueId].statusEntries, issue.statusEntries) )
			issue.statusEntries = this._scrubStatusEntries(issue.statusEntries, ["read", "status"]);

		existingIssues[issueId] = issue;
		this._updateIssueList(existingIssues, perspective);
	},

	_filterIssues: function(issues) {
		/*
			Algorithm:
				1. Get most recent statusEntry
				2. check whether "nextStatuses" array exists
					a) If statusRef of any nextStatus has "write" status by orgType of current user
							then existing tow issue is open
					b) otherwise requset is "closed"
		*/

		return _.filter(issues, (issue) => {
			let includeIssue = false;

			if ( _.isEmpty(issue) )
				return includeIssue;
			
			let siteRight = this._currentSiteRight
        , lastStatusRef = this._lookups.statuses[_.last(issue.statusEntries).statusId]
        , user = this._currentUser
        , filterState = user.settings.filters.statuses.states;
			
			if ( _.has(lastStatusRef, "nextStatuses") ) {
				let nextStatusIds = _.pluck(lastStatusRef.nextStatuses, "statusId");
					
				_.each(nextStatusIds, (statusId) => {
					let nextStatusRef = this._lookups.statuses[statusId];
					
					includeIssue = !_.has(nextStatusRef.accessRights, "read")
            || _.contains(siteRight.tasks, nextStatusRef.accessRights.read.taskId)
						? filterState[IssueMixin.Filters.OPEN]
						: filterState[IssueMixin.Filters.DONE]
				});
			} else
				includeIssue = filterState[IssueMixin.Filters.DONE]

			return includeIssue;
		});
	},

  _sortIssues: function(issues) {
  	let now = Moment();

  	let sortedIssues = _.sortBy(issues, (issue) => {
  		let statusEntry = _.last(issue.statusEntries)
  		  , diff = now.diff(Moment(statusEntry.timestamp), "seconds");
  		
      return diff;
  	});

  	return sortedIssues;
  },

  _updateIssueList: function(issues, perspective) {
  	// 1. Update model
  	if (!issues)
  		issues = this._issues[perspective];
  	else
  		this._issues[perspective] = issues;

  	let filteredIssues = {};

  	// 2. Filter issues based on selected filter
  	issues = this._filterIssues(_.toArray(issues));
  	
  	// 3. Sort issues based on their most recent status entry
  	issues = this._sortIssues(issues);
  	
  	_.each(issues, (issue) => {
  		filteredIssues[issue.iid] = issue;
  	});
		
		this.trigger( {issues: filteredIssues} );
  },

  _urlForQuery: function(url, params) {
		let queryString = Object.keys(params).map(key => key + "=" +encodeURIComponent(params[key])).join("&");		
		return url +queryString;
	},

	onUploadImg: function(imgObj) {
		// 1. Get S3 Policy data for uploading
  	
  	/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  		Need to workout how to handle edge-case of expired s3Policy
  	!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
		let fileExt = imgObj.file.ext
			, s3Data = this._s3Policy.data
			, s3Obj = {
			uri: imgObj.file.uri,
			uploadUrl: s3Data.url,
			mimeType: "image/" +fileExt,
			data: {
				acl: 'public-read',
				AWSAccessKeyId: s3Data.key,
				'Content-Type': "image/" +fileExt,
	      policy: s3Data.policy,
	      key: "issues/vehicle/" +imgObj.file.name,
	      signature: s3Data.signature,
      },
    };

  	NativeModules.FileTransfer.upload(s3Obj, (err, res) => {
    	if ( err == null && (res.status > 199 || res.status < 300) )
    		IssueActions.uploadImg.completed();
    	else
    		IssueActions.uploadImg.failed(err);
    });
	},

	onRecordImg: function(issue, imgObj) {
  	let qUpload = IssueActions.uploadImg.triggerPromise(imgObj)
      , params = ["images", issue.images.length]
  		, qRecord = IssueActions.setParam(issue, params, imgObj.dbRecord);

  	new Promise.all([qUpload, qRecord]).then((results) => {
  		console.log("images uploaded and recorded");
  		IssueActions.recordImg.completed();
  	}).catch((err) => {
  		console.log("Problem with upload and/or recording: ", err);
  		IssueActions.recordImg.failed(err);
  	})
	},

	onAddIssue: function(newIssue) {
		let issuesRef = this._db;
		let issueRef = issuesRef.push(newIssue);

		issueRef.update({"iid": issueRef.key()}, (err) => {
			if (err)
				IssueActions.addIssue.failed(err);
			else
				IssueActions.addIssue.completed(issueRef.key());
		});
	},

	onAddStatus: function(nextStatus, issue, notes, site) {
		console.log("issueId: ", issue.iid);

		let siteRight = this._currentSiteRight
		  , newUser = this._currentUser;
    
    LocationActions.getPosition.triggerPromise().then((position) => {
	    let prevUserId = _.last(issue.statusEntries).authorId;
	    let statusEntry = {
	      timestamp: Moment(Moment().toDate()).format(),
	      geoPoint: position,
	      statusId: nextStatus.iid,
	      authorId: newUser.iid,
	      notes: notes,
	    };

			IssueActions.setParam.triggerPromise(issue, ["statusEntries", issue.statusEntries.length], statusEntry)
				.then(() => {
					// 1. assign issue Id to user's current State when next status has islocked: true
        	if ( nextStatus.lockForUser )
            return ProfileActions.setIssueId(issue.iid, newUser.iid);
         	else {
         		// need to also remove from user of previous status
         		return ProfileActions.removeIssueId(prevUserId);
         	}
				}).then(() => {
					IssueActions.addStatus.completed();
				}).catch((err) => {
					IssueActions.addStatus.failed(err);
				});
		});
	},

	onBuildImgObj: function(imgTypeId, imgUri) {
		// retrieve Amazon S3 policy parameters early enough
		/*************************************************************************
		 If S3 policy times out, error callback will have to obtain a new policy
		*************************************************************************/
		let beg = imgUri.lastIndexOf('/') +1
			, end = imgUri.lastIndexOf('.')
			, fileExt = imgUri.substr(end +1);
    let userId = this._currentUser.iid;
   	
   	LocationActions.getPosition.triggerPromise().then((position) => {
   		let geoPoint = {
   			lat: position.lat,
   			latitude: position.lat,
   			long: position.long,
   			longitude: position.long
   		};

   		let filename = this._buildImgFilename(Moment().format("X"),userId,imgTypeId,fileExt);  		
   		let stagedImg = {
	  		dbRecord: {
		      authorId: userId,
		      uri: this._images.folderpath +filename,
		      geoPoint: geoPoint,
		      imgTypeId: imgTypeId,
		      statusId: "",
		      timestamp: Moment( Moment().toDate() ).format(),
		    },
		    file: {
		      ext: fileExt,
		      name: filename,
		      uri: "" +imgUri,
		    },
			};

			IssueActions.buildImgObj.completed(stagedImg);	
   	});
	},

	onEndListeners: function() {
		_.each(this._dbRefs, (dbRef) => {
			dbRef.off("child_changed");
			dbRef.off("child_added");
		});

		this._issues["site"] = null;
		this._issues["user"] = null;
		this._currentUser = null;
		this._currentSiteRight = null;
		this._db = null;
		this._images = null;
		this._imgTemplates = null;
		this._lookups = null;
		this._sites = null;
		this._s3Policy = null;
	},

	onExtractNextStatuses: function(statusEntry, issueId) {
		let self = this;

		let assignedToOtherIssue = function(issueId) {
      let assignmentStatus
        , userState = self._currentUser.state;
      
      return !_.isEmpty(userState.issueId);
    };

  	let assignedToThisIssue = function(issueId) {
      let assignmentStatus
        , userState = self._currentUser.state;
      
      return (userState.issueId === issueId);
    };

    let checkUserRights = function(prevStatusRef, nextStatusRef) {
	    let statusDef = self._lookups.statuses[nextStatusRef.statusId]
        , writeRight = _.has(statusDef, "accessRights") ? statusDef.accessRights.write : null
        , taskRefs = self._lookups.tasks
        , allowed;
	    
	    if ( _.has(writeRight, "task") && _.contains(self._currentSiteRight.tasks, writeRight.task) ) {
	      // check lock status
	      if (prevStatusRef.lockForUser)
	        allowed = assignedToThisIssue(issueId);
	      else
	        allowed = assignedToOtherIssue(issueId) && _.has(statusDef, "nextStatuses") ? false : true;
	    } else {
	      allowed = false;
	    }

	    return allowed ? statusDef : undefined;
	  };

    let statusRef = this._lookups.statuses[statusEntry.statusId]
      , nextStatuses = null;

    if ( _.has(statusRef, "nextStatuses") )
    	nextStatuses = _.transform(statusRef.nextStatuses, (result, nextStatusRef) => {
      	let nextStatus = checkUserRights(statusRef, nextStatusRef);
      
	      if ( !_.isEmpty(nextStatus) )
	        return result.push(nextStatus);
	    }) || new Array(0);

    IssueActions.extractNextStatuses.completed(nextStatuses);
  },

  onGetIssue: function(issueId, ) {
  	let issue = this._issues[issueId];
  	IssueActions.getissue.completed(issue);
  },

  onPullIssue: function(issueId, perspective) {
		if (!this._issues[perspective])
			return;

		let dbRef = this._db.child(issueId);
  	
  	dbRef.once("value", (issueRef) => {
			this._assignIssue(issueRef, perspective);
		});
  },

  // 1. One-time pull of existing tow issue base
  // 2. Setup listener for any updates made to existing tow issues
	onPullIssues: function(issueIds, perspective) {
		let qIssues = Defer()
		  , siteRight = this._currentSiteRight
		  , issuesRef = this._db.orderByChild("siteId").equalTo(siteRight.siteId);
		
    this._dbRefs.push(issuesRef);
		
		issuesRef.once("value", (allIssues) => {
			let issues = allIssues.val() || {}
        , issueIds = _.keys(issues);
			/*
				Run sorting and filter functions
				1. Scrub Tow issues
				2. Filter issues
				3. Sort filtered issues
			*/

			this._updateIssueList(issues, perspective);
			IssueActions.pullIssues.completed(this._issues[perspective] = issues);
			qIssues.resolve();
		});

		// handle updated tow issues
		qIssues.promise.then(() => {
			dbRef.on("child_changed", (snapshot) => this._assignIssue(snapshot, perspective));
		});
	},

  onRefreshIssues: function(perspective) {
		this._updateIssueList(null, perspective);
  },

	onRemoveFromImages: function(issue, imgTypeId) {
		let imagesRef = this._db.child(issue.iid).child("images");

		imagesRef.transaction((prevList) => {
		  if (!prevList)
		  	return null;
		  else {
		  	let newList = _.remove(prevList, (image) => {
		  		return image.imgTypeId !== imgTypeId;
		  	});
		  	
		  	return newList;
		  }
		}, (err) => {
			if (err)
				IssueActions.removeFromImages.failed("Couldn't remove ${imgTypeId} img");
      else
				IssueActions.removeFromImages.completed("Successfully removed ${imgTypeId} image");	
		});
	},

	onSetParam: function(issue, params, value) {
		let ref = this._db.child(issue.iid)
		  , lastIndex = _.last(params)
		  , action, arg;
		
		if ( _.isNumber(lastIndex) ) {
			action = "transaction";
			arg = function(prevList) {
				if (!prevList)
			  	prevList = [];

				prevList.push(value);
		    return prevList;
			};

			params = _.take(params, params.length - 1);
		} else {
			action = "set";
			arg = value;
		}

		_.each(params, (param) => {
			ref = ref.child(param);
		});

		ref[action](arg, (err) => {
			if (err)
				IssueActions.setParam.failed(err);
			else
				IssueActions.setParam.completed();
		});
	},

	_buildImgFilename: function(timestamp,userId,imgTypeId,fileExt) {
 		return timestamp +"-" +userId +"-" +imgTypeId +"." +fileExt;
  },

	_setLookups: function(data) {
		this._lookups = data.lookups;
	},

	_setProfile: function(data) {
		this._currentUser = data.currentUser;
		this._currentSiteRight = data.currentSiteRight;
	},

	_setSites: function(data) {
		this._sites = data.sites;
	},

	_updateHost: function(data) {
		this._db = data.db.child("issues");
		this._images = data.images;
		this._s3Policy = data.s3Policy;
	},
});

module.exports = IssueStore;