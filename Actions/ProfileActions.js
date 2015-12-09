'use strict'

var Reflux = require("reflux");
var ProfileActions = Reflux.createActions({
	"getAuth": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"removeIssueId": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setFilter":  {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setChosenSiteRight":  {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setIssueId": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"logoutUser": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setCurrentUser": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = ProfileActions;