'use strict'

var Reflux = require("reflux");
var HostActions = Reflux.createActions({
	"getDb": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	"initHost": {
		asyncResult: false,
		shouldEmit: function() {
			return true;
		}
	},
	"setImgHostURL": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = HostActions;