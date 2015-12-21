'use strict';

// REACT PARTS
var React = require("react-native");
var Reflux = require("reflux");

// COMPONENTS
var NextStatuses = require("../_IssueDetails/NextStatuses");

// ACTIONS && STORES

// MIXINS
var UserMixin = require("../Mixins/User");
var ViewMixin = require("../Mixins/View");

// Utilities
var Moment = require("moment");
var _ = require("lodash");

var {
	Image,
	PixelRatio,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	main: {
		flexDirection: "row",
	},
	paramBox: {
		flex: 1
	},
	status: {
		// color: "#A4A4A4",
		fontFamily: "System",
		fontWeight: "200",
		fontSize: 30,
		letterSpacing: 1
	},
	author: {
		color: "#DF7401",
		fontSize: 20,
		textAlign: "right"
	},
	timeAgo: {
		color: "#A4A4A4",
		fontSize: 20,
		textAlign: "right"
	}
});

var StatusEntry = React.createClass({
	mixins: [UserMixin, ViewMixin],
	propTypes: {
		currentUser: PropTypes.object,
		currentSiteRight: PropTypes.object,
		lookups: PropTypes.object,
		issue: PropTypes.object,
		show: PropTypes.object,
		site: PropTypes.object,
		statusEntry: PropTypes.object,
		styles: PropTypes.object,
		themeColor: PropTypes.string,
		user: PropTypes.object
	},
	_Author: null,
	_Img: null,
	_Status: null,
	_TimeAgo: null,
	_Timestamp: null,

	getDefaultProps: function() {
		return {
			show: {
				author: false,
				img: false,
				status: false,
				timeAgo: false,
				timestamp: false,
				update: false
			}
		};
	},

	getInitialState: function() {
		return { updateStatusBtn: {height: 0} };
	},

	componentWillMount: function() {
		let props = this.props;

		if ( props.show.author )
			this._buildAuthor(props.user, this._buildStatusEntryPart);
		
		if ( props.show.img )
			this._buildImg(props.user.uri.selfie);
		
		if ( props.show.timeAgo )
			this._buildTimeAgo(props.show.timeAgo ? props.statusEntry.timestamp : null, this._buildStatusEntryPart);
		
		if ( props.show.timestamp )
			this._buildTimestamp(props.statusEntry.timestamp, this._buildStatusEntryPart);

		if ( props.show.status )
			this._buildStatus(props.statusEntry.statusId);
	},

	componentWillUpdate: function(newProps, newState) {
		let oldProps = this.props, newShow = newProps.show, oldShow = oldProps.show;
		
		if ( newShow.author && !_.eq(newProps.user.name, oldProps.user.name) )
			this._buildAuthor(newProps.user, this._buildStatusEntryPart);
		
		if ( newShow.img && !_.eq(newProps.user.uri, oldProps.user.uri) )
			this._buildImg(newProps.user.uri.selfie);
		
		if ( newShow.timeAgo != oldShow.timeAgo )
			this._buildTimeAgo(newShow.timeAgo ? newProps.statusEntry.timestamp : null, this._buildStatusEntryPart);
		
		if ( newShow.timestamp )
			this._buildTimestamp(newProps.statusEntry.timestamp, this._buildStatusEntryPart);

		if ( newShow.status )
			this._buildStatus(newProps.statusEntry.statusId);
	},

	_buildAuthor: function(nameObj, buildCb) {
		let nameFormat = {
	    first: {
	      initial: false,
	      full: true
	    },
	    middle: {
	      initial: true,
	      full: true
	    },
	    last: {
	      initial: false,
	      full: true
	    }
	  };

		let name = this.buildName(nameObj, nameFormat);
		this._Author = buildCb(this.props.styles.author || styles.author, name);
	},

	_buildImg: function(uri) {
		let imgHostUrl = lookups.hosts.img.provider.url
		
		this._Img =
			<Image
				style={this.props.styles.img}
				source={{ uri: imgHostUrl +uri +"?fit=crop&w=49&h=49"}} />;
	},

	_buildStatus: function(statusId) {
		let statusDef = this.props.lookups.statuses[statusId];

		this._Status =
			<Text
				numberOfLines={1}
				style={this.props.styles.status || styles.status}>
				{statusDef.names.ui}
			</Text>;
	},

	_buildStatusEntryPart: function(style, value) {
		return (
			<View style={styles.paramBox}>
				<Text
					numberOfLines={1}
					style={style}>{value}</Text>
			</View>
		);
	},

	_buildTimeAgo: function(timestamp, buildCb) {
		this._TimeAgo = _.isEmpty(timestamp) ? null :
			buildCb(this.props.styles.timeAgo || styles.timeAgo, Moment(timestamp).fromNow());
	},

	_buildTimestamp: function(timestamp, buildCb) {
		this._Timestamp = _.isEmpty(timestamp) ? null :
			buildCb(this.props.styles.timeAgo || styles.timeAgo, Moment(timestamp).format('MMM Do YYYY @h:mm a'));
	},

	_setBtnDims: function(e) {
		let layout = e ? e.nativeEvent.layout : {
			height: 0,
			width: 0
		};
		
		if (this.state.updateStatusBtn.height !== layout.height) {
			this.state.updateStatusBtn.height = layout.height;
			this.setState(this.state);
		}
	},

	render: function() {
		let props = this.props, state = this.state;
		let Update = props.show["update"] ?
			<NextStatuses
      	currentUser={props.currentUser}
      	currentSiteRight={props.currentSiteRight}
      	lookups={props.lookups}
      	issue={props.issue}
      	setBtnDims={this._setBtnDims}
      	site={props.site}
      	statusEntry={props.statusEntry}
      	themeColor={props.themeColor} /> : null;

		return (
			<View style={props.styles.main || styles.main}>
				<View style={props.styles.info}>
					{this._Status}
					{this._TimeAgo}
					{this._Author}
					{this._Timestamp}
				</View>
				{this._Img}
				{Update}
			</View>
		);
	}
});

module.exports = StatusEntry;