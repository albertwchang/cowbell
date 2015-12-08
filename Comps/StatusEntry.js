'use strict';

// REACT PARTS
var React = require("react-native");
var Reflux = require("reflux");

// COMPONENTS
var NextStatuses = require("../_IssueDetails/NextStatuses");

// ACTIONS && STORES

// MIXINS
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
	mixins: [ViewMixin],
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
	_showPreApproval: false,
	_statusToApprove: null,

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
		if (this.props.show["update"])
			this._refreshStatusToApprove(this.props, this._setPreApprovalVisibility);
	},

	componentWillUpdate: function(newProps, newState) {
		let oldProps = this.props, oldState = this.state;
		
		if (newProps.show["update"]) {
			if ( !_.isEqual(newProps.issue.statusEntries, oldProps.issue.statusEntries) )
				this._refreshStatusToApprove(newProps, this._setPreApprovalVisibility);

			if ( !_.isEqual(newProps.issue.approvals, oldProps.issue.approvals) )
				this._setPreApprovalVisibility(newProps, this._statusToApprove);
		}
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

	_refreshStatusToApprove: function(props, preApproveCb) {
		/* 1. find status that:
			a) needs approval,
			b) hasn't been transacted yet, and
			c) has a prev status that refers to such status
		*/
		let lookups = props.lookups
			, lastStatusEntry = _.last(props.issue.statusEntries)
			, lastStatus = lookups.statuses[lastStatusEntry.statusId];
		
		// get statuses of each nextStatus statusRef
		if (_.has(lastStatus, "nextStatuses")) {
			this._statusToApprove = _.find(lastStatus.nextStatuses, (nextStatusRef) => {
				let nextStatus = lookups.statuses[nextStatusRef.statusId];
				
				return !_.isEmpty(nextStatus.prevStatuses.preApprove);
			});

			if (!this._statusToApprove)
				return;
			else {
				this._statusToApprove = lookups.statuses[this._statusToApprove.statusId];
				preApproveCb(props, this._statusToApprove);
			}
		}
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

	 _setPreApprovalVisibility: function(props, statusToApprove) {
		if (!statusToApprove)
			this._showPreApproval = false;
		else {
			// need to traverse all prev statuses to find any that 1) have a next status with accessRights, and 2) can approve
			let currentStatus = props.lookups.statuses[props.statusEntry.statusId];
			
		 	this._showPreApproval = !_.has(props.issue.approvals, statusToApprove.iid) && !_.isEmpty(this._statusToApprove);
		}
	},

	render: function() {
		let props = this.props, state = this.state;
		let lookups = props.lookups
			, statusEntry = props.statusEntry
			, userId = statusEntry.authorId
			, imgHostUrl = props.lookups.hosts.img.provider.url
			, statusId = statusEntry.statusId
			, statusRef = lookups.statuses[statusId]
			, passedStyles = props.styles
			, user = props.user

		let middleInitial = _.isEmpty(user.name.middle) ? " " : user.name.middle.charAt(0).toUpperCase() +". ";
		let author = {
			name: user.name.first +middleInitial +user.name.last,
			uri: user.uri.selfie
		};

		let Author = props.show["author"] ? this._buildStatusEntryPart(passedStyles.author || styles.author, author.name) : null;
		let TimeAgo = props.show["timeAgo"] ? this._buildStatusEntryPart(passedStyles.timeAgo || styles.timeAgo, Moment(statusEntry.timestamp).fromNow()) : null;
		let Timestamp = props.show["timestamp"] ? this._buildStatusEntryPart(passedStyles.date || styles.date, Moment(statusEntry.timestamp).format('MMM Do YYYY @h:mm a')) : null;
		let Img = props.show["img"] ?
			<Image
				style={passedStyles.img}
				source={{ uri: imgHostUrl +author.uri +"?fit=crop&w=49&h=49"}} /> : null;
		
		let Status = props.show["status"] ?
			<Text
				numberOfLines={1}
				style={passedStyles.status || styles.status}>{statusRef.names.ui}</Text> : null;

		let Update = props.show["update"] ?
			<NextStatuses
      	currentUser={props.currentUser}
      	currentSiteRight={props.currentSiteRight}
      	lookups={lookups}
      	issue={props.issue}
      	setBtnDims={this._setBtnDims}
      	site={props.site}
      	statusEntry={statusEntry}
      	themeColor={props.themeColor} /> : null;

		return (
			<View style={passedStyles.main || styles.main}>
				<View style={passedStyles.info}>
					{Status}
					{TimeAgo}
					{Author}
					{Timestamp}
				</View>
				{Img}
				{Update}
			</View>
		);
	}
});

module.exports = StatusEntry;