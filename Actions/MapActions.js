'use strict'

var Reflux = require("reflux");
var MapActions = Reflux.createActions({
	"makeAnnotations": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		},
	},
	"pullMapParams": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		},
	},
});

module.exports = MapActions;