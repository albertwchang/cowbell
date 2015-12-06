'User Strict'

var Display = require('react-native-device-display');
var React = require("react-native");

// COMPONENTS

// ACTIONS && STORES
var IssueActions = require("../Actions/IssueActions");

// MIXINS
var IssueMixin = require("../Mixins/Issue");

// Utilities
var Moment = require("moment");
var _ = require("lodash");

var {
	Image,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var _styles = StyleSheet.create({
	main: {
		backgroundColor: "#FF0000",
		flex: 1,
		flexDirection: "row",
		padding: 4
	},
	actionBtn: {
		backgroundColor: "#FFFFFF",
		borderRadius: 4,
		borderWidth: 0.5,
		padding: 2
	},
	approvalText: {
		color: "#FFFFFF",
		fontFamily: "System",
		fontSize: 30,
		fontWeight: "200",
		justifyContent: "center",
		letterSpacing: 1,
		textAlign: "left"
	},
	btnText: {
		color: "#FE2E2E",
		fontFamily: "System",
		fontSize: 22,
		fontWeight: "200",
		textAlign: "center"
	}
});

var PreApproval = React.createClass({
	mixins: [IssueMixin],
	propTypes: {
		approverOrgTypeIds: PropTypes.array,
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		issue: PropTypes.object,
		setWorkflowStage: PropTypes.func,
		statusToApprove: PropTypes.object,
		style: PropTypes.object,
		visible: PropTypes.bool,
		workflowMessages: PropTypes.array
	},

	// shouldComponentUpdate: function(newProps) {
	// 	var oldProps = this.props;

	// 	return !_.eq(newProps.issue, oldProps.issue)
	// 			|| !_.eq(newProps.statusToApprove, oldProps.statusToApprove)
	// 			|| !_.eq(newProps.workflowStages, oldProps.workflowStages);

	// },

	_saveApproval: function(status) {
		// add approval info to issue if it exists
		var props = this.props
			, currentUser = props.currentUser
			, issue = props.issue;

		var approver = this.prepApprover(props.currentSiteRight);
		_.assign(approver, {id: currentUser.iid});
		
		var approval = this.prepApproval(approver, status.iid);
		approval.signatureUri = currentUser.uri.signature;
		
		props.setWorkflowStage("approve", 1);
		
		IssueActions.setParam.triggerPromise(issue, ["approvals", approval.statusId], approval)
			.then(() => {
				props.setWorkflowStage("approve", 2);
			}).catch((err) => {
				props.setWorkflowStage("approve", 3);
			});
	},

	render: function() {
		var props = this.props
			, issue = props.issue
			, statusToApprove = props.statusToApprove
			, allowedToApprove = (_.contains(props.approverOrgTypeIds, props.currentSiteRight.orgTypeId))
			
		if (!props.visible)
			return null;
		
		var Content = "*** Needs Approval ***", ActionBtn;

		if (allowedToApprove)
			ActionBtn =
				<TouchableHighlight
					onPress={() => this._saveApproval(statusToApprove)}
					style={_styles.actionBtn}>
					<View style={{flex: 4, paddingHorizontal: 6, paddingVertical: 2}}>
						<Text style={_styles.btnText}>Approve</Text>
					</View>
				</TouchableHighlight>;

		return (
			<View style={props.style || _styles.main}>
				<View style={{flex: 8, alignItems: "center", justifyContent: "center"}}>
					<Text style={_styles.approvalText}>{Content}</Text>
				</View>
				{ActionBtn}
			</View>
		);
	}
});

module.exports = PreApproval;