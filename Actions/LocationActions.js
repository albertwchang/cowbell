'use strict'

var Reflux = require("reflux");
var LocationActions = Reflux.createActions({
	"getPosition": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setPositionOptions": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"setPositionStream": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = LocationActions;