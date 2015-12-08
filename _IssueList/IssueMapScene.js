'use strict'

// React Native Parts
var React = require('react-native');
var Display = require('react-native-device-display');
var Icon = require("react-native-vector-icons/Ionicons");
var Reflux = require("reflux");
var Refresh = require("react-native-refreshable-listview");

// CUSTOM COMPONENTS
var Site = require("../Comps/Site");
var LineSeparator = require("../Comps/LineSeparator");
var IssueImages = require("../Comps/IssueImages");
var StatusEntry = require("../Comps/StatusEntry");
var User = require("../Comps/User");

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// STORES && ACTIONS

// Utilities
var _ = require("lodash");

var {
	Image,
 	Navigator,
 	PropTypes,
	StyleSheet,
	TouchableHighlight,
	Text,
	View,
} = React;

var _styles = StyleSheet.create({
	issueBox: {
		borderWidth: 1.0,
		flexDirection: "row",
		margin: 4
	}, img: {
		justifyContent: "center",
		flex: 1,
		height: 77,
		resizeMode: "contain",
		width: 77
	}, info: {
		flex: 3,
		flexDirection: "column",
		paddingVertical: 4,
	}
});

var statusEntryStyle = StyleSheet.create({
	mainBox: {
		flexDirection: "row",
		flex: 1,
		paddingHorizontal: 6
	}, status: {
			flex: 1,
			fontSize: 17
		}, timeAgo: {
			color: "#A4A4A4",
			flex: 1,
			fontSize: 17,
			textAlign: "right"
		}
});

var IssueListScene = React.createClass({
	propTypes: {
		context: PropTypes.string,
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		ds: PropTypes.object,
		imgHost: PropTypes.object,
		lookups: PropTypes.object,
		openIssue: PropTypes.func,
		reloadIssues: PropTypes.func,
		issues: PropTypes.object,
		route: PropTypes.object,
		showSearchBar: PropTypes.bool,
		sites: PropTypes.array,
		themeColors: PropTypes.array,
		users: PropTypes.array
	},
	mixins: [SiteMixin, ViewMixin],
	getInitialState: function() {
		return {
			issueDims: null,
		}
	},

	componentWillUnmount: function() {
		console.log("Summary Scene unmounted");
	},

	shouldComponentUpdate: function() {
		return this.props.navigator.getCurrentRoutes().length === 1;
	},

	_renderIssue: function(issue, sectionId, rowId) {
		let props = this.props
			, img = issue.images["vehicle"]
			, siteRight = props.currentSiteRight
			, imgUri = props.imgHost.url +img.uri +"?fit=crop&w=60&h=60"
			, lastStatusEntry = _.last(issue.statusEntries)
			, site = props.sites[siteRight.siteId]
			, status = props.lookups.statuses[lastStatusEntry.statusId]
			, themeColor = props.themeColor
			, user = props.users[lastStatusEntry.authorId]
			, isDoneStyle = !_.has(status, "nextStatuses") ? this.Styles._viewStyle.on : this.Styles._viewStyle.off;
		
		return (
			<TouchableHighlight
				key={rowId}
				underlayColor="#A4A4A4"
				onPress={() => props.openIssue(issue)}
				style={isDoneStyle}>
				<View
					accessibilityOnTap={true}
					key={rowId}
					removeClippedSubviews={true}
					style={ [_styles.issueBox, isDoneStyle] }>
					<Image
						source={{uri: imgUri}}
						style={_styles.img} />
					<View style={_styles.info}>
						<Site
							info={client}
							imgHost={props.imgHost}
							showAddy={{street: true}}
							showImg={false} />
						<StatusEntry
							client={client}
							entityType="site"
							showStatus={true}
							showTimeAgo={true}
							statusEntry={lastStatusEntry}
							styles={statusEntryStyle}
							vendor={vendor} />
					</View>
				</View>
			</TouchableHighlight>
		);
	},

	_renderSeparator: function(section, issueId) {
		// var issues = _.toArray(this.props.issues);
		return (<LineSeparator color="orange" height={0} vertMargin={6} />)
	},

	render: function() {
		let props = this.props
			, dimensions = this.Dimensions
			, siteRight = props.currentSiteRight
			, listHeight = Display.height - dimensions.STATUS_BAR_HEIGHT - dimensions.TAB_BAR_HEIGHT - dimensions.NAV_BAR_HEIGHT
			, themeColor = props.themeColors[siteRight.orgTypeId]
			, Header = props.showSearchBar ?
			<SearchBar
		    placeholder='Search'
		    onChangeText={(value) => console.log(value)}
		    onSearchButtonPress={() => console.log("run search")}
		    onCancelButtonPress={() => console.log("Close search bar")} /> :
			<User
				employerSite={props.sites[siteRight.orgTypeId][siteRight.siteId]}
				imgHost={props.imgHost}
				info={props.currentUser}
				themeColor={themeColor} />

		return (
			<View style={{height: listHeight}}>
				{Header}
				<Refresh
					contentInset={{top: -dimensions.STATUS_BAR_HEIGHT}}
	        dataSource={props.ds.cloneWithRows(props.issues)}
	        minDisplayTime={500}
	        minPulldownDistance={30}
	        removeClippedSubviews={true}
	        renderRow={this._renderIssue}
					renderSeparator={this._renderSeparator}
					loadData={props.reloadIssues} />
			</View>
		);
	},
});

module.exports = IssueListScene;