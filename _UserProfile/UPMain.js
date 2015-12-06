'use strict';

// REACT PARTS
var Display = require("react-native-device-display");
var React = require("react-native");
var Reflux = require("reflux");

// ACTIONS && STORES
var ProfileActions = require("../Actions/ProfileActions");
var ProfileStore = require("../Stores/ProfileStore");

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// UTILITIES
var _ = require("lodash");

var {
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	main: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		borderWidth: 1,
		flex: 1,
		height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT - ViewMixin.Dimensions.TAB_BAR_HEIGHT - 20,
		justifyContent: "center",
		margin: 10,
		position: "absolute",
		top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
		width: Display.width - 20
	},
	text: {
		color: "#000000",
		fontSize: 80,
		textAlign: "center"
	}
});

var ProfileContext = React.createClass({
	mixins: [Reflux.ListenerMixin, Reflux.connect(ProfileStore)],

	componentWillUnmount: function() {
		console.log("Profile Context unmounted");
		this.stopListeningToAll();
	},

	_logout: function() {
		ProfileActions.logoutUser.triggerPromise();
	},

	render: function() {
		return (
			<TouchableHighlight
				onPress={this._logout}>
				<View style={styles.main}>
					<Text style={styles.text}>Logout</Text>
				</View>
			</TouchableHighlight>
		);
	}
});

module.exports = ProfileContext;