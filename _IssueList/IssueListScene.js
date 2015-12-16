'use strict'

// React Native Parts
var React = require('react-native');
var Display = require('react-native-device-display');
var Icon = require("react-native-vector-icons/Ionicons");
var Reflux = require("reflux");
var Refresh = require("react-native-refreshable-listview");
// var SearchBar = require("react-native-search-bar");

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
	issue: {
		backgroundColor: ViewMixin.Colors.night.section,
		flexDirection: "column",
		marginHorizontal: 2
	},
	issueBox: {
		borderLeftWidth: 0.5,
		borderRightWidth: 0.5,
		borderTopWidth: 0.5,
		flexDirection: "row",
	},
	img: {
		justifyContent: "center",
		flex: 1,
		height: 77,
		resizeMode: "contain",
		width: 77
	},
	info: {
		flex: 3,
		flexDirection: "column",
		paddingVertical: 4,
	}
});

var IssueListScene = React.createClass({
	propTypes: {
		context: PropTypes.string,
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		ds: PropTypes.object,
		lookups: PropTypes.object,
		reloadIssues: PropTypes.func,
		issues: PropTypes.object,
		openIssue: PropTypes.func,
		route: PropTypes.object,
		showSearchBar: PropTypes.bool,
		sites: PropTypes.object,
		themeColor: PropTypes.string,
		users: PropTypes.object
	},
	mixins: [SiteMixin, ViewMixin],
	_imgDims: {
		height: 0,
		width: 60
	},
	getInitialState: function() {
		return {
			issueDims: null,
		}
	},

	componentWillMount: function() {
		this._imgDims.height = this._imgDims.width / this.AspectRatios["1x1"];
	},

	componentWillUnmount: function() {
		console.log("Summary Scene unmounted");
	},

	shouldComponentUpdate: function() {
		return this.props.navigator.getCurrentRoutes().length === 1;
	},

	_renderIssue: function(issue, sectionId, rowId) {
		let props = this.props;
		let img = _.first(issue.images)
		let siteRight = props.currentSiteRight
		let imgHost = props.lookups.hosts.img.provider
		let imgUri = imgHost.url +img.uri +"?fit=crop&w=" +this._imgDims.width +"&h=" +this._imgDims.height
		let lastStatusEntry = _.last(issue.statusEntries)
		let site = props.sites[issue.siteId]
		let statusDef = props.lookups.statuses[lastStatusEntry.statusId]
		let user = props.users[lastStatusEntry.authorId]
		let isDoneStyle = !_.has(statusDef, "nextStatuses") ? {borderColor: props.themeColor} : this.Styles._viewStyle.off
		let statusEntryStyles = StyleSheet.create({
				info: {
					backgroundColor: "#424242",
					flexDirection: "row",
					flex: 1,
					padding: 4,
				}, status: {
						color: props.themeColor,
						flex: 1,
						fontSize: 15
					},
					timeAgo: {
						color: "#D8D8D8",
						flex: 1,
						fontSize: 15,
						textAlign: "right"
					}
			});

		return (
			<TouchableHighlight
				key={rowId}
				underlayColor="#A4A4A4"
				onPress={() => props.openIssue(issue)}>
				<View key={rowId} style={_styles.issue}>
					<StatusEntry
						currentUser={props.currentUser}
	        	currentSiteRight={props.siteRight}
						lookups={props.lookups}
						issue={issue}
						show={{timeAgo: true, status: true}}
						site={site}
						statusEntry={lastStatusEntry}
						styles={statusEntryStyles}
						themeColor={props.themeColor}
						user={user} />
					<View
						accessibilityOnTap={true}
						key={rowId}
						style={ [_styles.issueBox, isDoneStyle] }>
						<Image
							source={{uri: imgUri}}
							style={_styles.img} />
						<Site
							info={site}
							imgHost={imgHost}
							showAddy={{street: true, city: true}}
							showImg={true}
							style={_styles.info} />
					</View>
				</View>
			</TouchableHighlight>
		);
	},

	_renderHeader: function() {
		return (<LineSeparator height={0} horzMargin={0} vertMargin={2} />);
	},

	_renderSeparator: function(sectionId, issueId) {
		let hMargin = 0.45
				, props = this.props;

		return (
			<LineSeparator
				key={issueId}
				color={props.themeColor} 
				height={1}
				horzMargin={Display.width * hMargin}
				vertMargin={Display.width * (0.5 - hMargin)} />
			);
	},

	render: function() {
		let props = this.props
			, siteRight = props.currentSiteRight
			, listHeight = Display.height - this.getInnerView();
		
		// let Header = props.showSearchBar ?
		let Header = 
			// <SearchBar
		 //    placeholder='Search'
		 //    onChangeText={(value) => console.log(value)}
		 //    onSearchButtonPress={() => console.log("run search")}
		 //    onCancelButtonPress={() => console.log("Close search bar")} /> :
			<User
				employerSite={props.sites[siteRight.siteId]}
				imgHost={props.lookups.hosts["img"].provider}
				info={props.currentUser}
				themeColor={props.themeColor} />

		return (
			<View style={{height: listHeight}}>
				{Header}
				<Refresh
	        dataSource={props.ds.cloneWithRows(props.issues)}
	        loadData={props.reloadIssues}
	        minDisplayTime={500}
	        minPulldownDistance={30}
	        removeClippedSubviews={true}
	        renderHeaderWrapper={this._renderHeader}
	        renderRow={this._renderIssue}
					renderSeparator={this._renderSeparator} />
			</View>
		);
	},
});

module.exports = IssueListScene;