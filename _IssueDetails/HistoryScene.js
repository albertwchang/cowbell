'use strict';

// REACT PARTS
var Display = require("react-native-device-display");
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");
var StatusEntry = require("../Comps/StatusEntry");

// COMPONENTS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES
var SiteStore = require("../Stores/SiteStore");

// Utilities
var _ = require("lodash");

var {
	Image,
	ListView,	
	PropTypes,
	StyleSheet,
	Text,
	View,
} = React;

var _styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "column",
		height: Display.height - ViewMixin.getInnerView(),
		paddingHorizontal: 4
	},
	separatorIcon: {
		alignSelf: "center",
		color: ViewMixin.Colors.night.border,
		fontSize: 20,
		paddingVertical: 2
	}
});

var HistoryScene = React.createClass({
	mixins: [Reflux.ListenerMixin, Reflux.connect(SiteStore), SiteMixin, ViewMixin],
	propTypes: {
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		ds: PropTypes.object,
		lookups: PropTypes.object,
		issue: PropTypes.object,
		site: PropTypes.object,
		themeColor: PropTypes.string,
		users: PropTypes.object
	},
	// _ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),

	getInitialState: function() {
		return {
			imgDims: null
		};
	},

	componentWillUpdate: function(newProps, newState) {
		let abc = 5;
	},

	_renderRow: function(statusEntry, sectionId, rowId) {
		let props = this.props
			, themeColor = props.themeColor
			, user = props.users[statusEntry.authorId];

		let statusEntryStyle = StyleSheet.create({
				info: {
					backgroundColor: this.Colors.night.section,
					borderColor: themeColor,
					borderRadius: 2,
					borderTopWidth: 0.5,
					borderLeftWidth: 0.5,
					borderBottomWidth: 0.5,
					flex: 3,
					flexDirection: "column",
					paddingHorizontal: 10,
					paddingVertical: 5
				}, status: {
						color: themeColor,
						flex: 1,
						fontSize: 24,
						fontFamily: "System",
						fontWeight: "200",
						letterSpacing: 2
					}, author: {
						color: themeColor,
						fontSize: 14,
						letterSpacing: 1
					}, date: {
						color: "#D8D8D8",
						flex: 1,
						fontSize: 14,
						fontWeight: "bold",
						letterSpacing: 1
					},
				img: {
					borderColor: themeColor,
					borderWidth: 0.5,
					flex: 1
				}
			});

		return (
			<StatusEntry
				key={statusEntry.statusId}
				currentUser={props.currentUser}
      	currentSiteRight={props.currentSiteRight}
				lookups={props.lookups}
				issue={props.issue}
				show={{author: true, timestamp: true, img: true, status: true}}
				site={props.site}
				statusEntry={statusEntry}
				styles={statusEntryStyle}
				themeColor={themeColor}
				user={user} />
		);
	},

	_renderSeparator: function(status, rowId) {
		if ( parseInt(rowId) < (this.props.issue.statusEntries.length - 1) )
			return (<Icon key={rowId} name={"arrow-up-b"} style={_styles.separatorIcon} />);
	},

	render: function() {
		let props = this.props
			, state = this.state
			, statusEntries = _.cloneDeep(props.issue.statusEntries);

		return (
			<ListView
				contentInset={{top: -(this.Dimensions.STATUS_BAR_HEIGHT * 3 / 4)}}
				dataSource={props.ds.cloneWithRows(statusEntries.reverse())}
				initialListSize={statusEntries.length}
				removeClippedSubviews={true}
				renderRow={this._renderRow}
				renderSeparator={this._renderSeparator}
				style={_styles.container} />
		);
	},
});

module.exports = HistoryScene;