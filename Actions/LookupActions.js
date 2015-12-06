'use strict'

var Reflux = require("reflux");
var LookupActions = Reflux.createActions({
	"endListeners": {
		asyncResult: false,
		shouldEmit: function() {
			return true;
		}
	},
	"validateLookups": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = LookupActions;