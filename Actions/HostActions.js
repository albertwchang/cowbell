'use strict'

var Reflux = require("reflux");
var HostActions = Reflux.createActions({
	// "getS3Policy": {
	// 	asyncResult: true,
	// 	shouldEmit: function() {
	// 		return true;
	// 	}
	// },
	"getDb": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
	// "pullS3Policy": {
	// 	asyncResult: true,
	// 	shouldEmit: function() {
	// 		return true;
	// 	}
	// },
	"setImgHostURL": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = HostActions;