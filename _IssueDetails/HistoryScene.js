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
		lookups: PropTypes.object,
		issue: PropTypes.object,
		sites: PropTypes.object,
		statusLookups: PropTypes.object,
		themeColors: PropTypes.array,
		users: PropTypes.array
	},
	_ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),

	getInitialState: function() {
		return {
			imgDims: null
		};
	},

	componentWillUpdate: function(newProps, newState) {
		let abc = 5;
	},

	_renderRow: function(statusEntry, sectionId, rowId, themeColors) {
		let props = this.props
			, statusRef = props.statusLookups[statusEntry.statusId]
			, statusEntryStyle = StyleSheet.create({
				info: {
					backgroundColor: this.Colors.night.section,
					borderColor: props.themeColors[statusEntry.author.orgTypeId],
					borderRadius: 2,
					borderTopWidth: 0.5,
					borderLeftWidth: 0.5,
					borderBottomWidth: 0.5,
					flex: 3,
					flexDirection: "column",
					paddingHorizontal: 10,
					paddingVertical: 5
				}, status: {
						color: props.themeColors[statusEntry.author.orgTypeId],
						flex: 1,
						fontSize: 24,
						fontFamily: "System",
						fontWeight: "200",
						letterSpacing: 2
					}, author: {
						color: themeColors[statusEntry.author.orgTypeId],
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
					borderColor: themeColors[statusEntry.author.orgTypeId],
					borderWidth: 0.5,
					flex: 1
				}
			});

		if (statusRef.accessRights.read.status[this.props.currentSiteRight.orgTypeId])
			return (
				<StatusEntry
					key={statusEntry.statusId}
					currentUser={props.currentUser}
        	currentSiteRight={props.currentSiteRight}
					lookups={props.lookups}
					issue={props.issue}
					show={{author: true, timestamp: true, img: true, status: true}}
					sites={props.sites}
					statusEntry={statusEntry}
					styles={statusEntryStyle}
					themeColors={props.themeColors}
					users={props.users} />
			);
		else
			return null;
	},

	_renderSeparator: function(status, rowId) {
		if ( parseInt(rowId) < (this.props.issue.statusEntries.length - 1) )
			return (<Icon key={rowId} name={"arrow-up-b"} style={_styles.separatorIcon} />);
	},

	render: function() {
		let props = this.props, state = this.state
			, statusEntries = _.cloneDeep(props.issue.statusEntries);

		return (
			<ListView
				contentInset={{top: -(this.Dimensions.STATUS_BAR_HEIGHT * 3 / 4)}}
				dataSource={this._ds.cloneWithRows(statusEntries.reverse())}
				initialListSize={statusEntries.length}
				removeClippedSubviews={true}
				renderRow={(statusEntry, sectionId, rowId) => this._renderRow(statusEntry, sectionId, rowId, props.themeColors)}
				renderSeparator={this._renderSeparator}
				style={_styles.container} />
		);
	},
});

module.exports = HistoryScene;