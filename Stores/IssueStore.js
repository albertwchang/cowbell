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

	_assignIssue: function(issueRef, entityType) {
		var issueId = issueRef.key();
		var issue = issueRef.val();
		var existingissues = this._issues[entityType]; // issues is NOT an array!!!
		
		if ( existingIssues[issueId] && !_.eq(existingIssues[issueId].statusEntries, issue.statusEntries) )
			issue.statusEntries = this._scrubStatusEntries(issue.statusEntries, ["read", "status"]);

		existingIssues[issueId] = issue;
		this._updateIssueList(existingIssues, entityType);
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
			var includeIssue = false;

			if (_.isEmpty(Issue))
				return includeIssue;
			
			var siteRight = this._currentSiteRight;
			var lastStatusRef = this._lookups.statuses[_.last(issue.statusEntries).statusId];
			var user = this._currentUser;
			var filterState = user.settings.filters.statuses.states
			
			if ( _.has(lastStatusRef, "nextStatuses") ) {
				var nextStatusIds = _.pluck(lastStatusRef.nextStatuses, "statusId");
					
				_.each(nextStatusIds, (statusId) => {
					var nextStatusRef = this._lookups.statuses[statusId];
					
					includeIssue = nextStatusRef.accessRights.read.status[siteRight.orgTypeId]
							? filterState[IssueMixin.Filters.OPEN]
							: filterState[IssueMixin.Filters.DONE]
				});
			} else
				includeIssue = filterState[IssueMixin.Filters.DONE]

			return includeIssue;
		});
	},

	_mapVehicleData: function(vehicleData) {
		var dataMap = this._lookups.hosts.vehicle["dataMap"];
    
    return {
  		drivetrain: dataMap.drivetrain[vehicleData.drivenWheels] || "",
  		transmission: dataMap.transmission[vehicleData.transmission.transmissionType] || "",
   		vehicleType: dataMap.vehicleType[vehicleData.categories.vehicleType] || "",
  		make: vehicleData.make.name || "",
	    model: vehicleData.model.name || "",
	    year: vehicleData.years[0].year.toString() || 0
  	}
  },

  _scrubStatusEntries: function(statusEntries, params) {
    var currentOrgTypeId = this._currentSiteRight.orgTypeId
    var scrubbedStatusEntries = _.filter(statusEntries, (statusEntry) => {
      var statusRef = this._lookups.statuses[statusEntry.statusId];
      // var isStatusAllowed = (statusLookup.accessRights[currentOrgTypeId].status[action] === true);
      
      var isStatusAllowed = _.get(statusRef.accessRights, params)[currentOrgTypeId];

      return isStatusAllowed;
    });

		return scrubbedStatusEntries;
	},

  _sortIssues: function(issues) {
  	var now = Moment();

  	var sortedIssues = _.sortBy(issues, (issue) => {
  		var statusEntry = _.last(issue.statusEntries);
  		var diff = now.diff(Moment(statusEntry.timestamp), "seconds");
  		return diff;
  	});

  	return sortedIssues;
  },

  _updateIssueList: function(issues, entityType) {
  	// 1. Update model
  	if (!issues)
  		issues = this._issues[entityType];
  	else
  		this._issues[entityType] = issues;

  	var filteredIssues = {};

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
		var queryString = Object.keys(params).map(key => key + "=" +encodeURIComponent(params[key])).join("&");		
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
  	let qUpload = IssueActions.uploadImg.triggerPromise(imgObj);
  	let params = ["images", issue.images.length]
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
		var issuesRef = this._db;
		var issueRef = issuesRef.push(newIssue);

		issueRef.update({"iid": issueRef.key()}, (err) => {
			if (err)
				IssueActions.addIssue.failed(err);
			else
				IssueActions.addIssue.completed(issueRef.key());
		});
	},

	onAddStatus: function(nextStatus, issue, notes, sites) {
		console.log("issueId: ", issue.iid);
		// var issueStatusEntriesRef = this._db.child(issue.iid).child("statusEntries");
		var siteRight = this._currentSiteRight;
		var newUser = this._currentUser;
    
    LocationActions.getPosition.triggerPromise().then((position) => {
	    var prevUserId = _.last(issue.statusEntries).author.id;
	    var statusEntry = {
	      timestamp: Moment(Moment().toDate()).format(),
	      geoPoint: position,
	      statusId: nextStatus.iid,
	      author: {
	        id: newUser.iid,
	        orgTypeId: siteRight.orgTypeId,
	      },
	      notes: notes,
	    };

			Async.parallel([
				(statusEntryCb) => {
					IssueActions.setParam.triggerPromise(issue, ["statusEntries", issue.statusEntries.length], statusEntry)
					.then(() => {
						// 1. assign issue Id to user's current State when next status has islocked: true
	        	if (nextStatus.assignTo[siteRight.orgTypeId].user)
	            return ProfileActions.setIssueId(issue.iid, newUser.iid);
	         	else {
	         		// need to also remove from user of previous status
	         		return ProfileActions.removeIssueId(prevUserId);
	         	}
					}).then(() => {
						statusEntryCb(null, "Status Entry has been saved");
					}).catch((err) => {
						statusEntryCb("Couldn't add status entry", null);
					});	
				},
				(siteAndIssueCb) => {
					// 2. Add issue Id to all other allies' issue list
		    	if ( nextStatus.assignTo[this._orgTypeIds.VENDOR].site ) {
		    		// iterate through all ally orgTypes of client
		    		var allySites = _.omit(sites, this._orgTypeIds.CLIENT)
		    			, qAllySites = [];

						_.each(allySites, (allySite, key) => {
							var qAllySite = new Promise((resolve, reject) => {
								Async.parallel([
									(issueIdCb) => {
										SiteActions.setIssueId.triggerPromise(issue.iid, allySite.iid, key).then(() => {
											issueIdCb(null, "issueId added to " +key);
										}).catch((err) => {
											issueIdCb(err +": issueId NOT added to " +key, null);
										});
									},
									(siteIdCb) => {
										IssueActions.setParam.triggerPromise(issue, ["sites", key, "siteId"], allySite.iid).then(() => {
											siteIdCb(null, allySite.iid +" added to issue: " +issue.iid);
										}).catch((err) => {
											siteIdCb(err +": " +allySite.iid +"NOT added to issue: " +issue.iid, null);
										});
									}
								], (err, results) => {
									if (err)
										reject();
									else
										resolve();
								});
							});

							qAllySites.push(qAllySite);
						});

						new Promise.all(qAllySites).then((results) => {
		      		siteAndIssueCb(null, "IssueId added to all Ally sites, and all siteIds added to issue");
		      	}).catch((err) => {
	      			siteAndIssueCb(err +": Couldn't add issueId and/or SiteId", null);
	      		});
		    	} else
		    		siteAndIssueCb(null, "IssueId and SiteId unecessary");
				}
			], (err, results) => {
				if (err)
					IssueActions.addStatus.failed(err);

      	IssueActions.addStatus.completed();
			});
		});
	},

	onBuildImgObj: function(imgTypeId, imgUri) {
		// retrieve Amazon S3 policy parameters early enough
		/*************************************************************************
		 If S3 policy times out, error callback will have to obtain a new policy
		*************************************************************************/
		var beg = imgUri.lastIndexOf('/') +1
			, end = imgUri.lastIndexOf('.')
			, fileExt = imgUri.substr(end +1);
    var userId = this._currentUser.iid;
   	
   	LocationActions.getPosition.triggerPromise().then((position) => {
   		var geoPoint = {
   			lat: position.lat,
   			latitude: position.lat,
   			long: position.long,
   			longitude: position.long
   		};

   		var filename = this._buildImgFilename(Moment().format("X"),userId,imgTypeId,fileExt);  		
   		var stagedImg = {
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
		var self = this;
		var assignedToOtherIssue = function(issueId) {
      var assignmentStatus;
      var userState = self._currentUser.state;

      switch(self._currentSiteRight.orgTypeId) {
        case SiteMixin._orgTypeIds.VENDOR:
          assignmentStatus = (userState.issueId != "");
          break;
       	case SiteMixin._orgTypeIds.CLIENT:
          assignmentStatus = false;
          break;
      }

      return assignmentStatus;
    };

  	var assignedToThisIssue = function(issueId) {
      var assignmentStatus;
      var userState = self._currentUser.state;

      switch(self._currentSiteRight.orgTypeId) {
        case SiteMixin._orgTypeIds.VENDOR:
          assignmentStatus = (userState.issueId == issueId);
          break;
        
        case SiteMixin._orgTypeIds.CLIENT:
          assignmentStatus = true;
          break;
      }

      return assignmentStatus;
    };

    var checkUserRights = function(prevStatusRef, nextStatusRef) {
	    var statusRef = self._lookups.statuses[nextStatusRef.statusId];
	    var writeRight = statusRef.accessRights.write;
	    var taskRefs = self._lookups.tasks;
	    var allowed;
	    
	    if ( writeRight.status[self._currentSiteRight.orgTypeId] === true
	    	// && _.contains(self._currentSiteRight.tasks, IssueMixin.TaskIds.UPDATE_STATUS) ) {
				&& (writeRight.task === null || _.contains(self._currentSiteRight.tasks, writeRight.task)) ) {

	      // check lock status
	      if (prevStatusRef.lockForUser)
	        allowed = assignedToThisIssue(issueId);
	      else
	        allowed = assignedToOtherIssue(issueId) && _.has(statusRef, "nextStatuses") ? false : true;
	    } else {
	      allowed = false;
	    }

	    return allowed ? statusRef : undefined;
	  };

    var statusRef = this._lookups.statuses[statusEntry.statusId];
    var nextStatuses = null;

    if ( _.has(statusRef, "nextStatuses") ) {
    	nextStatuses = _.transform(statusRef.nextStatuses, (result, nextStatusRef) => {
      	var nextStatus = checkUserRights(statusRef, nextStatusRef);
      
	      if (nextStatus)
	        return result.push(nextStatus);
	    }) || new Array(0);

	    IssueActions.extractNextStatuses.completed(nextStatuses);
    } else
    	IssueActions.extractNextStatuses.completed(nextStatuses);
  },

  onGetIssue: function(issueId, ) {
  	var issue = this._issues[issueId];
  	IssueActions.getissue.completed(issue);
  },

  onPullIssue: function(issueId, entityType) {
		if (!this._issues[entityType])
			return;

		var dbRef = this._db.child(issueId);
  	
  	dbRef.once("value", (issueRef) => {
			this._assignIssue(issueRef, entityType);
		});
  },

  // 1. One-time pull of existing tow issue base
  // 2. Setup listener for any updates made to existing tow issues
	onPullIssues: function(issueIds, entityType) {
		var qIssues = Defer();
		var siteRight = this._currentSiteRight;
		var dbRef = this._db.orderByChild("sites/" +siteRight.orgTypeId +"/siteId").equalTo(siteRight.siteId);
		this._dbRefs.push(dbRef);
		
		dbRef.once("value", (allIssues) => {
			var issues = allIssues.val();
			var issueIds = _.keys(issues);
			/*
				Run sorting and filter functions
				1. Scrub Tow issues
				2. Filter issues
				3. Sort filtered issues
			*/

			if (!issueIds || issueIds.length === 0)
				issues = {};
			else
				_.each(issueIds, (issueId) => {
					var issue = issues[issueId];
					issue.statusEntries = this._scrubStatusEntries(issue.statusEntries, ["read", "status"]);
					issues[issueId] = issue;
				});

			this._updateIssueList(issues, entityType);
			IssueActions.pullIssues.completed(this._issues[entityType] = issues);
			qIssues.resolve();
		});

		// handle updated tow issues
		qIssues.promise.then(() => {
			dbRef.on("child_changed", (snapshot) => this._assignIssue(snapshot, entityType));
		});
	},

  onPullVehicleData: function(vin) {
    var host = this._lookups.hosts["vehicle"];    
    var url = host.url +vin +"?";
    var query = this._urlForQuery(url, host.params["url"]);

    fetch(query, host.params["connection"])
      .then((res) => {
        if (res.status === 200) {
          var data = JSON.parse(res._bodyText);
          IssueActions.pullVehicleData.completed(this._mapVehicleData(data));
        } else {
          IssueActions.pullVehicleData.failed();  
        }
      }).catch((err) => {
        IssueActions.pullVehicleData.failed();
      });
  },

  onRefreshIssues: function(entityType) {
		this._updateIssueList(null, entityType);
  },

	onRemoveFromImages: function(issue, imgTypeId) {
		var imagesRef = this._db.child(issue.iid).child("images");

		imagesRef.transaction((prevList) => {
		  if (!prevList)
		  	return null;
		  else {
		  	var newList = _.remove(prevList, (image) => {
		  		return image.imgTypeId !== imgTypeId;
		  	});
		  	
		  	return newList;
		  }
		}, (err) => {
			if (err)
				IssueActions.removeFromImages.failed("Couldn't remove ${imgTypeId} img");
			else {
				IssueActions.setTodoStatus.triggerPromise(issue, "images", "done", imgTypeId, false)
					.then(() => {
						IssueActions.removeFromImages.completed("Successfully removed ${imgTypeId} image");
					}).catch((err) => {
						IssueActions.removeFromImages.failed("Couldn't remove ${imgTypeId} img");
					});
				
			}
		});
	},

	onSetParam: function(issue, params, value) {
		var ref = this._db.child(issue.iid);
		var lastIndex = _.last(params);
		var action, arg;
		
		if (_.isNumber(lastIndex)) {
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
			
			var todoTriggerDef = this._lookups.todos.triggers[_.first(params)]
				, todoTrigger = todoTriggerDef ? this.getTodoTrigger(todoTriggerDef, action, value) : null;

			if (_.isEmpty(todoTrigger))
				IssueActions.setParam.completed();
			else
				IssueActions.setTodoStatus.triggerPromise(issue, todoTrigger)
					.then(() => {
						IssueActions.setParam.completed();
					}).catch((err) => {
						IssueActions.setParam.failed();
					});
		});
	},

	onSetTodoStatus: function(issue, trigger) {
		_.each(trigger.todos, (todoId) => {
			issue.todoMap[todoId][trigger.state] = trigger.value;
		});
		
		IssueActions.setParam.triggerPromise(issue, ["todoMap"], issue.todoMap)
			.then(() => {
				IssueActions.setTodoStatus.completed();
			}).catch((err) => {
				IssueActions.setTodoStatus.failed(err);
			});
	},

	onUpdateVehicle: function(issueId, params, newValue) {
		var vehicleRef = this._db.child(issueId).child("vehicle");
		var paramRef = vehicleRef;

		_.each(params, (param) => {
			paramRef = paramRef.child(param);
		});

		paramRef.set(newValue, (err) => {
			if (err)
				IssueActions.updateVehicle.failed(err);
			else
				IssueActions.updateVehicle.completed();
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