'use strict'

var Reflux = require("reflux");
var SiteActions = Reflux.createActions({
	"endListeners": {
		asyncResult: false,
		shouldEmit: function() {
			return true;
		}
	},
	"getEmployerSite": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"getSite": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"pullEmployerSite": {
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
});

module.exports = SiteActions;