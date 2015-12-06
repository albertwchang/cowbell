'use strict'

var Reflux = require("reflux");
var UserActions = Reflux.createActions({
	"endListeners": {
		asyncResult: false,
		shouldEmit: function() {
			return true;
		}
	},
	"pullUsers": {
		asyncResult: true,
		shouldEmit: function() {
			return true;
		}
	},
});

module.exports = UserActions;