'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");
// var YouTube = require('react-native-youtube');

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");

// COMPONENTS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES

// Utilities
var _ = require("lodash");

var {
	Image,
	ListView,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var _styles = StyleSheet.create({
	header: {
		backgroundColor: "#2E2E2E",
		borderBottomWidth: 0.5,
		flexDirection: "row",
		height: ViewMixin.Dimensions.NAV_BAR_HEIGHT,
		width: Display.width
	}, headerText: {
			fontFamily: "System",
			fontSize: 30,
			textAlign: "left"
		}, headerClose: {
			fontSize: 34,
			textAlign: "center"
		},
	body: {
		backgroundColor: "#000000",
		width: Display.width
	}, bodyText: {
			fontSize: 20,
			fontWeight: "200",
			textAlign: "left"
		}
});

var CodeScene = React.createClass({
	mixins: [Reflux.ListenerMixin, SiteMixin, ViewMixin],
	propTypes: {
		closeInfo: PropTypes.func,
		reason: PropTypes.object,
		style: PropTypes.number,
		themeColor: PropTypes.string
	},
	getInitialState: function() {
		return {
		};
	},

	render: function() {
		return (
			<View style={this.props.style}>
				<View style={ [_styles.header, {borderColor: this.props.themeColor}] }>
					<View style={{flex: 9, justifyContent: "center"}}>
						<Text
							numberOfLines={1}
							style={ [_styles.headerText, {color: this.props.themeColor}] }>{this.props.reason.name}</Text>
					</View>
					<TouchableHighlight
		        onPress={this.props.closeInfo}
		        style={{flex: 1}}>
						<Icon
							name={"ios-close-outline"}
							style={ [_styles.headerClose, {color: this.props.themeColor, flex: 1}] } />
					</TouchableHighlight>
				</View>
				<View style={_styles.body}>
					<Text
						numberOfLines={8}
						style={ [_styles.bodyText, {color: this.props.themeColor}] }>{this.props.reason.desc}</Text>
				</View>
				<LineSeparator height={0} horzMargin={0} vertMargin={10} />
				{/*<YouTube
				  videoId={this.props.reason.videoId}
				  play={true}
				  hidden={false}
				  playsInline={true}
				  onReady={() => console.log("Playing...")}
				  onChangeState={() => console.log("Changed state...")}
				  onChangeQuality={() => console.log("Quality has changed...")}
				  onError={() => console.log("There was an error")}
				  style={ [_styles.body, {height: Display.width / ViewMixin.AspectRatios["16x9"]}] } />*/}
			</View>
		);
	},
});

module.exports = CodeScene;