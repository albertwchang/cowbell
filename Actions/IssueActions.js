'use strict'

var Reflux = require("reflux");
var IssueActions = Reflux.createActions({
	"addIssue": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"recordImg": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"uploadImg": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"addStatus": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	// "buildImgObj": {
	// 	asyncResult: true,
	// 	shouldEmit: function() {
	// 		return true;
	// 	}
	// },
	"endListeners": {
		asyncResult: false,
		shouldEmit: function() {
			return true;
		}
	},
	"extractNextStatuses": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"getImgTemplates": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"getIssue": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"pullIssue": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"pullIssues": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"pullVehicleData": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"refreshIssues": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"removeFromImages": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setParam": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setSiteId": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setTodoStatus": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setVehicle": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"updateVehicle": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = IssueActions;