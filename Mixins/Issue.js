var SiteMixin = require("./Site");
var _ = require("lodash");

var Issue = {
	Images: {
		LICENSE_PLATE: "licensePlate",
		VEHICLE: "vehicle",
		VIN: "vin"
	},
	Filters: {
		DONE: "done",
		OPEN: "open"
	},
	SceneIndexes: {
		APPROVAL: 0,
		LICENSEPLATE: 2,
		POLICE: 0,
		REASON: 0,
		VEHCILEINFO: 2,
		VIN: 2
	},
	StatusIds: {
		SUGGEST: "status0",
		CONFIRM: "status1",
		CREATE: "status2"
	},
	TaskIds: {
		CREATE_TOW_issue: "task2",
		UPDATE_STATUS: "task3",
		VIEW_STATUS: "task4"
	},

	buildSites: function(siteIds, statusRef, orgTypeTodoEntries, orgTypeTodos) {
    let sites = _.mapValues(siteIds, (siteId, orgTypeId) => {
      let sid = statusRef.assignTo[orgTypeId].site ? siteId : ""
      	, site = {
		      siteId: sid,
		      comments: "",
		      orgTypeId: orgTypeId
		    };

		  // First: refer to todoValues values.  If none provided, use todo options
      if (_.has(orgTypeTodos, orgTypeId)) {
      	let todoEntrySet = orgTypeTodoEntries[orgTypeId];
      	let newTodoEntrySet = _.mapValues(orgTypeTodos[orgTypeId], (todo, todoId) => {
	    		var entry = {
	    			todoId: todoId,
	    			value: todo.options ? _.first(todo.options) : ""
	    		};

	    		if (!_.isEmpty(todoEntrySet) && !_.isEmpty(todoEntrySet[todoId]))
			    	entry = todoEntrySet[todoId];

	    		return entry;
	    	});

	    	// _.assign(todoSet, orgTypeTodoEntries[orgTypeId]);
	    	_.assign(site, {todoItems: newTodoEntrySet});
	    }
    
      return site;
    });

    return sites;
	},

	buildTodoMap: function(lookups, issue) {
		// 1. Traverse each 1st-level param of the issue
		// 2. obtain todoTrigger associated with each issue param
		var todoMap = {}
			, todoTriggerDefs = _.cloneDeep(lookups.todos.triggers)
			, todoMapTemplate = function(todoId) {
				return {
					"done": false,
					"todoId": todoId,
					"needed": false
				};
			};
		
		_.each(todoTriggerDefs, (todoTriggerDef, param) => {
			var action = _.isArray(issue[param]) ? "transaction" : "set"
				, issueParam = issue[param]
				, todoTrigger = todoTriggerDef["group"];

			// issue param is assumed to be a model, and the child nodes are entries
			// e.g. vehicle has "color", "transmission"; sites have "client" or "vendor"
			if (_.isEmpty(todoTrigger))
				_.each(issueParam, (paramEntry) => {
					todoTrigger = this.getTodoTrigger(todoTriggerDef, action, paramEntry);
					
					if (!_.isEmpty(todoTrigger)) {
						_.each(todoTrigger.todos, (todoId) => {
							if (!todoMap[todoId])
								todoMap[todoId] = todoMapTemplate(todoId);

							todoMap[todoId][todoTrigger.state] = todoTrigger.value;
						});
					}
				})
			else
				_.each(todoTrigger.todos, (todoId) => {
					if (_.has(todoTrigger, "params")) {
						if (!todoMap[todoId])
							todoMap[todoId] = todoMapTemplate(todoId);

						var vehicleParamValues = _.map(todoTrigger.params, (param) => {
							return issueParam[param].value;
						});

						todoMap[todoId][todoTrigger.state] = this.isDone(vehicleParamValues);
					} else
						todoMap[todoId][todoTrigger.state] = true;
				});
		});

		return todoMap;
	},

	buildVehicle: function(vehicle) {
    var vehicleObj = _.mapValues(vehicle, (param, key) => { 
      return {
	      ref: param.iid,
	      value: ""
	    };
    });

    return vehicleObj;
	},

	findApprovingStatus: function(statusToApprove, statusDefs) {
		let prevStatusIds = statusToApprove.prevStatuses.options
			, approvingStatus;

		_.find(prevStatusIds, (statusId) => {
			let status = statusDefs[statusId];
			let statusRef = !status["nextStatuses"]
									? null
									: _.find(status["nextStatuses"], (statusRef) => {
										return !_.isEmpty( _.property(["accessRights", "approve"])(statusRef) );
									});
			
			if (!statusRef || statusRef.statusId !== statusToApprove.iid)
				return false;
			else {
				approvingStatus = status;
				return true;
			}
		});

		return approvingStatus;
	},

	getApproverOrgType: function(status) {
		if (_.has(status.accessRights, "approve"))
			return _.findKey(status.accessRights.approve, (value) => {
				return value === true;
			});
		else
			return undefined;
	},

	getOldApproval: function(issue, statusId) {
		return _.has(issue, "approvals") ? issue.approvals[statusId] : undefined;
	},

	getSubmitStatuses: function(allStatusRefs, currentSiteRight) {
		var submitStatuses = _.filter(allStatusRefs, (statusRef) => {
			var writeRight = statusRef.accessRights.write;

			// 1. get all statuses that are allowed to be writeable by current user's orgTypeId
			if (writeRight.status[currentSiteRight.orgTypeId])
				// 2a. filter out statuses that does NOT have a prevStatuses property
				// 2b. filter out statuses that have a writeable task property === to CREATE_TOW_issue		
				return this._isStartStatus(statusRef) || this._isAllowedStatus(writeRight, currentSiteRight.tasks)
			else
				return false;
		});

		return submitStatuses;
	},

	getTodoTrigger: function(todoTriggerDef, action, value) {
		// process triggers when updating todoItems
		var todoTrigger, modelId;

		if (!todoTriggerDef.key)
			todoTrigger = todoTriggerDef.group;
		else {
			modelId = value[todoTriggerDef.key];
			todoTrigger = todoTriggerDef.options[modelId];	
		}

		if (todoTrigger) {
			var todoValue = value;

			// value evaluation has to be done w/ values that are set in DB
			if (action === "set") {
				// evaluate the new value
				if (_.has(todoTrigger, "path"))
					todoValue = _.property(todoTrigger.path)(value);

				// validate whether all params have been fulfilled with todoValue
				if (_.has(todoTrigger, "params")) {
					var vehicleParams = _.chain(todoValue).pick(todoTrigger.params).pluck("value").value();

					todoTrigger.value = _.every(vehicleParams, (vehicleParam) => {
						return _.isBoolean(vehicleParam) || !_.isEmpty(vehicleParam);
					});
				}

				// when the value to be checked is actually an array
				else if (_.isArray(todoValue) || _.some(todoValue, _.isObject))
					_.each(todoValue, (todoItem) => {
						todoTrigger.value = _.isBoolean(todoItem.value) || !_.isEmpty(todoItem.value);
					});
				else
					todoTrigger.value = _.isBoolean(todoValue) || !_.isEmpty(todoValue);
			}

			return todoTrigger;
		}

		return;
	},

	isDone: function(list) {
		return _.every(list, (item) => {
			return _.isBoolean(item) ? true : !_.isEmpty(item);
		});
	},

	prepApproval: function(approver, statusId) {
		return {
  		approver: approver,
  		signatureUri: null,
  		statusId: statusId
  	}
	},

	prepApprover: function(site) {
		return {
      orgTypeId: site.orgTypeId,
      siteId: site["siteId"] || site["iid"]
    };
	},

	preApprovingStatusRef: function(sourceStatus, nextStatusId) {
		return _.find(sourceStatus["nextStatuses"], (statusRef) => {
			return !_.isEmpty( _.property(["accessRights", "approve"])(statusRef) );
		});
	},

	_isStartStatus: function(statusRef) {
		return !_.has(statusRef, "prevStatuses");
	},

	_isAllowedStatus: function(writeRight, userTaskIds) {
		return _.has(writeRight, "task")
			&& (writeRight.task === this.TaskIds.CREATE_TOW_issue && _.contains(userTaskIds, this.TaskIds.CREATE_TOW_issue));
	}
};

module.exports = Issue;