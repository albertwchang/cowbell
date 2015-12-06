var StyleSheet = require("react-native").StyleSheet;

var Common = {
	CONST: {
		CLIENT: "client",
		VENDOR: "vendor"
	},
	Helpers: {
		getAllyOrgTypeId: function(orgTypeId) {
			return (orgTypeId === "vendor") ? "client" : "vendor";
		}
	},
	Styles: {
		_textStyle: StyleSheet.create({
			on: {
				color: "#31B404"
			}, off: {
				color: "#A4A4A4"
			}, liked: {
				color: "#31B404"
			}, hated: {
				color: "#FF0000"
			}
		}),
		_viewStyle: StyleSheet.create({
			on: {
				borderColor: "#31B404"
			}, off: {
				borderColor: "#A4A4A4"
			}
		})
	}
};

module.exports = Common;