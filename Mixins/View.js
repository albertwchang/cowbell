// var Dims = require("react-native").Dimensions;
var StyleSheet = require("react-native").StyleSheet;

var View = {
	AspectRatios: {
		"21x9": 21/9,
		"16x9": 16/9,
		"16x10": 16/10,
		"4x3": 4/3,
		"1x1": 1
	},
	Colors: {
		night: {
			background: "#000000",
			section: "#1C1C1C",
			border: "#D8D8D8",
			separator: "#F2F2F2",
			text: "#F2F2F2"
		},
		day: {
			background: "#FFFFFF",
			section: "#BDBDBD",
			border: "#585858",
			separator: "#2E2E2E",
			text: "#2E2E2E"
		}
	},
	Dimensions: {
		ACTION_BTN_HEIGHT: 50,
		NAV_BAR_HEIGHT: 43,
		STATUS_BAR_HEIGHT: 20,
		TAB_BAR_HEIGHT: 50
	},
	Orientations: {
		// getOrientation: function() {
		// 	return Dims.get("window").width > Dims.get("window").height ? "landscapeRight" : "portrait"
		// },
		LANDSCAPE: "landscapeRight",
		PORTRAIT: "portrait"
	},
	getInnerView: function() {
		var dims = this.Dimensions;

		return dims.STATUS_BAR_HEIGHT + dims.NAV_BAR_HEIGHT + dims.TAB_BAR_HEIGHT;
	},
	Styles: {
		_textStyle: StyleSheet.create({
			need: {
				color: "#FA5858"
			},
			on: {
				color: "#3ADF00"
			},
			off: {
				color: "#D8D8D8"
			},
			"n/a": {
				color: "#585858"
			},
			liked: {
				color: "#31B404"
			},
			hated: {
				color: "#FF0000"
			}
		}),
		_viewStyle: StyleSheet.create({
			need: {
				borderColor: "#FA5858"
			},
			on: {
				borderColor: "#3ADF00"
			},
			off: {
				borderColor: "#D8D8D8"
			},
			"n/a": {
				borderColor: "#585858"
			},
			liked: {
				backgroundColor: "#31B404"
			},
			hated: {
				backgroundColor: "#FF0000"
			}
		})
	}
};

module.exports = View;