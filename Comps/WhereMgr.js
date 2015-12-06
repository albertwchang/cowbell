'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");

// CUSTOM COMPONENTS
var Site = require("../Comps/Site");

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var _ = require("lodash");

var {
	Image,
	ListView,
	Modal,
	PropTypes,
	StatusBarIOS,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var WhereScene = React.createClass({
	propTypes: {
		clientSiteId: PropTypes.string,
		clientSites: PropTypes.object,
		currentUser: PropTypes.object,
		currentSiteRight: PropTypes.object,
		imgHost: PropTypes.object,
		setSite: PropTypes.func
  },

  mixins: [SiteMixin, ViewMixin],

	_styles: StyleSheet.create({
		container: {
			flex: 1,
			flexDirection: "column",
			height: Display.height,
			width: Display.width,
		},
		exit: {
			alignItems: "center",
			backgroundColor: "#2E2E2E",
			borderTopWidth: 1,
			borderColor: "#A4A4A4",
			bottom: 0,
			height: 50,
			paddingVertical: 3,
			paddingHorizontal: 8,
			position: "absolute",
			width: Display.width,
		}, exitIcon: {
			color: "#31B404",
			fontSize: 44,
		}, instructionBox: {
			backgroundColor: "#2E2E2E",
			borderColor: "#A4A4A4",
			borderBottomWidth: 0.5,
			flexDirection: "row",
			justifyContent: "center",
			paddingVertical: 2,
			paddingHorizontal: 8
		}, instructionText: {
			color: "#A4A4A4",
			fontFamily: "System",
			fontSize: 24,
			fontWeight: "200",
			textAlign: "center",
		},

		menuBox: {
			backgroundColor: "#000000",
			flex: 1,
			height: Display.height,
			opacity: 0.85,
			position: "absolute",
			top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			width: Display.width
		}, optionBox: {
				borderColor: "#A4A4A4",
				borderRadius: 4,
				borderWidth: 1,
				flex: 1,
				flexDirection: "row",
				justifyContent: "center",
				margin: 4
			}, choiceIcon: {
				alignSelf: "center",
				color: "#FFFFFF",
				flex: 1,
				fontSize: 34,
				justifyContent: "center"
			}, siteBox: {
					flex: 6,
					flexDirection: "row",
					padding: 4,
					paddingVertical: 10
				}
	}),

	getInitialState: function() {
		return {
			ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid})
		};
	},

	componentWillMount: function() {
		StatusBarIOS.setStyle("light-content");
	},

	_setSite: function(site) {
		// this.props.leave();
		this.props.setSite(site);
	},

	_renderSite: function(site, sectionId, rowId) {
		var CheckBox = this.state.chosenSiteId === site.iid
			? <Icon name={"ios-checkmark"} style={[this._styles.choiceIcon, this.Styles._textStyle.on]} />
			: <Icon name={"ios-circle-outline"} style={[this._styles.choiceIcon, this.Styles._textStyle.off]} />

		return (
			<TouchableHighlight
				key={rowId}
  			onPress={() => this._setSite(site)}>
				<View style={this._styles.optionBox}>
	  			{CheckBox}
		      <Site
						imgHost={this.props.imgHost}
						info={site}
						showAddy={{street: true, city: false, state: false, zip: false}} 
						showImg={true}
						style={this._styles.siteBox} />
	  		</View>
  		</TouchableHighlight>	
		);
	},

	render: function() {
		return (
			<View style={this._styles.menuBox}>
	      <ListView
					contentInset={{top: -this.Dimensions.STATUS_BAR_HEIGHT}}
	        dataSource={this.state.ds.cloneWithRows(this.props.clientSites)}
	        initialListSize={this.props.clientSites.length}
	        removeClippedSubviews={true}
	        renderRow={this._renderSite} />
	    </View>
		);
	},
});

module.exports = WhereScene;