'use strict';

// REACT PARTS
var Collapsible = require('react-native-collapsible/Collapsible');
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");
var TimerMixin = require('react-timer-mixin');

// COMPONENTS
var Approver = require("./Approver");
var ActionButtons = require("../Comps/ActionButtons");
var LineSeparator = require("../Comps/LineSeparator");
var Pending = require("../Comps/Pending");
var PreApproval = require("../Comps/PreApproval");
var ReasonMgr = require("../Comps/ReasonMgr");
var Signature = require("../Comps/Signature");

// ACTIONS && STORES
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");
var UserStore = require("../Stores/UserStore");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var Async = require("async");
var _ = require("lodash");

var {
	Image,
	ListView,
	Modal,
	PropTypes,
	StyleSheet,
	Text,
	TextInput,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	main: {
		flex: 1,
	},
});

var NextStatuses = React.createClass({
	propTypes: {
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		imgHost: PropTypes.object,
		lookups: PropTypes.object,
		issue: PropTypes.object,
		setBtnDims: PropTypes.func,
		showPreApproval: PropTypes.bool,
		sites: PropTypes.object,
		statusEntry: PropTypes.object,
		statusToApprove: PropTypes.object,
		statuses: PropTypes.object,
		themeColors: PropTypes.array
	},
	mixins: [Reflux.ListenerMixin, Reflux.connect(UserStore), IssueMixin, SiteMixin, ViewMixin],
	_approvingStatus: null,
	_currentWorkflow: "save",
	_notes: "",
	_showPreApproval: false,
	_workflowMessages: ["Waiting to Save", "Trying to Save...", "New status saved!", "Error: Couldn't save"],
	_styles: StyleSheet.create({
		approverSection: {
			borderRadius: 3,
			borderWidth: 0.75
		},
		updateStatusBox: {
			backgroundColor: "#000000",
			height: Display.height,
			flex: 1,
			justifyContent: "flex-end",
			width: Display.width
		}, usStep: {
				backgroundColor: "#000000",
				flexDirection: "column",
				padding: 2
			}, headerText: {
				color: "#FF8000",
				flexDirection: "row",
				fontSize: 24,
				fontFamily: "arial"
			},
			statusOptions: {
				flexDirection: "column",
			}, statusEntry: {
					flex: 1,
					flexDirection: "row",
					marginTop: 4
				}, indicatorIcon: {
						flex: 1,
						fontSize: 34,
						justifyContent: "center"
					},
					itemBox: {
						flex: 5,
						justifyContent: "center",
						paddingHorizontal: 6
					}, itemText: {
							color: "#FFFFFF",
							fontSize: 34,
							fontWeight: "200"
						},
				statusNotes: {
					backgroundColor: "#1C1C1C",
					borderColor: '#FF8000',
					borderWidth: 0.5,
					color: "#00FF40",
					fontSize: 18,
					fontWeight: "200",
					height: 120,
					paddingHorizontal: 8,
					paddingVertical: 4
				},
			actionButtons: {
				alignItems: "center",
				flexDirection: "row",
				height: ViewMixin.Dimensions.ACTION_BTN_HEIGHT,
				justifyContent: "center",
				width: Display.width
			},
		settingStatus: {
			height: Display.height,
      justifyContent: "center",
      width: Display.width
		}
	}),

	getInitialState: function() {
		return {
			approvals: {
				fresh: null,
				pre: null
			},
			canSave: false,
			chosenStatus: null,
			hideComments: true,
			nextStatuses: null,
			scenes: {
				finalize: false,
				signature: false
			},
			workflowStages: [
        {
          isActive: true,
          end: false,
          success: true
        }, {
          isActive: false,
          end: false,
          success: true
        }, {
          isActive: false,
          end: true,
          success: true
        }, {
          isActive: false,
          end: true,
          success: false
        }
	    ]
		};
	},

	componentWillMount: function() {
		this._refreshData(this.props);
		this._setPreApprovalVisibility();
	},

	componentWillUpdate: function(newProps, newState) {
		let oldProps = this.props, oldState = this.state;

		if ( !_.eq(oldProps.currentUser.state.issueId, newProps.currentUser.state.issueId)
			|| !_.eq(oldProps.currentSiteRight, newProps.currentSiteRight)
			|| !_.eq(oldProps.statusEntry, newProps.statusEntry) ) {
			this._refreshData(newProps);
			this._setPreApprovalVisibility();	
		}

		this._allowedToSave(newProps, newState);
	},

	_allowedToSave: function(props, state) {
		let chosenStatus = state.chosenStatus
			, canSave = this.state.canSave;

		// 1. When approval is needed, chosen status is set, and approval is fully set
		if (chosenStatus) {
			let oldApproval = this.getOldApproval(props.issue, chosenStatus.iid)
				, approval = state.approvals.fresh || oldApproval;

			if (!chosenStatus.needsApproval)
				canSave = true;
			else if ( approval && approval.signatureUri && approval.approver )
				canSave = true;
			else
				canSave = false;
		}
		else
			canSave = false;

		if (this.state.canSave !== canSave)
			this.setState({canSave: canSave});
	},

	_refreshData: function(newProps) {
		// need to wipeout old data
		this.setState(this._resetParams());

		IssueActions.extractNextStatuses.triggerPromise(newProps.statusEntry, newProps.issue.iid)
			.then((nextStatuses) => {
				if (!nextStatuses) {
					this.props.setBtnDims();
					this.state.chosenStatus = undefined;
				} else
					this._setStatus(_.findWhere(nextStatuses, {"isPreferred": true}) || _.first(nextStatuses));
				
				this.state.nextStatuses = nextStatuses;	
				this.setState(this.state);
			});
	},

	_resetParams: function() {
		this._notes = "";
		let params = {
			approvals: {
				fresh: null,
				pre: null
			},
			canSave: false,
			chosenStatus: null,
			hideComments: true,
			nextStatuses: null
		};

		return params;
	},

	_saveStatus: function(nextStatus) {
		// turn on Activity Indicator
		this._setWorkflowStage("save", 1);
		let self = this
			, props = this.props
			, lookups = props.lookups
			, issue = props.issue;

		Async.parallel([
      (addStatusCb) => {
      	// 1b. Add status to existing tow issue
      	IssueActions.addStatus.triggerPromise(nextStatus, issue, this._notes, props.sites)
					.then(() => {
						// Post add steps:
						// 1. Reset this._notes to empty string
						// self._notes = "";

						addStatusCb(null, "New status has been added");
					}).catch((err) => {
						addStatusCb("Could not add status", null);
					});
      },
      (addApprovalsToIssueCb) => {
      	var approvals = _.toArray(self.state.approvals);
      	var qApprovals = new Array(approvals.length);

      	_.each(approvals, (approval, index) => {
      		qApprovals[index] = new Promise((resolve, reject) => {
      			if (approval) {
      				IssueActions.setParam.triggerPromise(issue, ["approvals", approval.statusId], approval)
			    			.then(() => {
			    				resolve();		
			    			}).catch((err) => {
			    				reject();
			    			});
      			}
			    	else
		    			resolve();
		    	});
		    });

		    Promise.all(qApprovals).then((results) => {
		    	addApprovalsToIssueCb(null, "Approvals has been added");
		    }).catch((err) => {
		    	addApprovalsToIssueCb("Could not add approvals, OR none to add", null);
		    });
      }
    ], (err, results) => {
      if (err)
      	return;

      self._setWorkflowStage("save", 2);
    });
	},

  _setApproval: function(approver, type, statusId) {
  	if (!this.state.approvals[type]) {
  		this.state.approvals[type] = this.prepApproval(approver, statusId);
  		this.setState(this.state);
  	}
  	else
  		this._setApprovalProperty({approver: approver}, type);
  },

  _setPreApprovalVisibility: function() {
		let props = this.props
			, statusEntry = props.statusEntry
			, sta = props.statusToApprove;
		
		if (_.isEmpty(sta))
			return;
		else
			this._showPreApproval = false;
		
		this._approvingStatus = this.findApprovingStatus(sta, props.lookups.statuses);
		let approvalExists = _.has(props.issue.approvals, sta.iid);

		if (statusEntry.statusId === this._approvingStatus.iid)
			// When Approving status is transacted (preApprovingStatus === current status)
				// show PreApproval toast when no approval
			this._showPreApproval = !approvalExists;
		else {
			// When current status != ApprovalStatus && statusToApprove exists (assuming "Tow Now" has not been transacted)
				// show PreApproval toast for orgTypeId that cannot approve ApprovalStatus
			let staRef = this.preApprovingStatusRef(this._approvingStatus);
			this._showPreApproval = !approvalExists && !staRef.accessRights.approve[props.currentSiteRight.orgTypeId];
		}	
	},

  _setApprovalProperty: function(property, type) {
  	_.assign(this.state.approvals[type], property);
  	this.setState(this.state);
  },

  _setStatus: function(status) {
  	// check whether nextStatuses of chosen status has to pre-approve the nextStatus
  	this.state.chosenStatus = status;

  	let currentSiteRight = this.props.currentSiteRight
  		, currentUser = this.props.currentUser;

  	if ( !_.isEmpty(this.props.statusToApprove) && (this._approvingStatus.iid == status.iid) ) {
  		let approver = this.prepApprover(currentSiteRight);
  		_.assign(approver, {id: this.props.currentUser.iid});

  		this._setApproval(approver, "pre", this.props.statusToApprove.iid);
  		this._setApprovalProperty({signatureUri: currentUser.signatureUri}, "pre");
  	} else
  		this.setState(this.state);
  },

  _setSignature: function(uri, type) {
		this.state.approvals[type].signatureUri = uri;
		this.setState(this.state);
	},

	_setWorkflowStage: function(workflow, level) {
    this._currentWorkflow = workflow;
    let workflowStages = _.map(this.state.workflowStages, (stage) => {
      stage.isActive = false;
      return stage;
    });

    workflowStages[level].isActive = true;
    this.state.workflowStages = workflowStages;
    this.setState(this.state);
  },

	_toggleScene: function(param, state) {
		this.state.scenes[param] = state;
		this.setState(this.state);
	},

	_renderStatus: function(nextStatus) {
		let chosenStatus = this.state.chosenStatus
			, IndicatorIcon = (chosenStatus && chosenStatus["iid"] === nextStatus["iid"])
			? <Icon
					name="ios-circle-filled"
					style={ [this._styles.indicatorIcon, this.Styles._textStyle.on] } />
			: <Icon
					name="ios-circle-outline"
					style={ [this._styles.indicatorIcon, this.Styles._textStyle.off] } />;

		let StatusText =
			<Text style={ [this._styles.itemText, (chosenStatus && chosenStatus["iid"] === nextStatus["iid"]) ? this.Styles._textStyle.on : this.Styles._textStyle.off] }>
				{nextStatus.names["action"]}
			</Text>

		return (
			<TouchableHighlight
				key={nextStatus.iid}
				onPress={ () => this._setStatus(nextStatus) }>
				<View style={this._styles.statusEntry}>
					{IndicatorIcon}
					<View style={this._styles.itemBox}>{StatusText}</View>
				</View>
			</TouchableHighlight>
		);
	},

	render: function() {
		let props = this.props, state = this.state
			, chosenStatus = state.chosenStatus
			, currentSiteRight = props.currentSiteRight
			, nextStatuses = state.nextStatuses
			, issueId = props.issue.iid
			, issue = props.issue
			, themeColors = props.themeColors
			, CommentsHeader = state.hideComments ?
			{
				text: <Text style={this._styles.headerText}>Press To Add Comments</Text>,
				icon: <Icon name="ios-arrow-down" style={ [this._styles.indicatorIcon, this._styles.headerText] } />
			} : {
				text: <Text style={this._styles.headerText}>2. Add Some Comments</Text>,
				icon: <Icon name="ios-arrow-up" style={ [this._styles.indicatorIcon, this._styles.headerText] } />
			};

		if (state.scenes.finalize) {
			// being in finalize scene assumes that there is a nextStatus option
			let needsApproval = false, oldApproval;
			
			if (chosenStatus) {
				needsApproval = chosenStatus.needsApproval;
				oldApproval = this.getOldApproval(issue, chosenStatus.iid);
			}

			let approvalStyle = {
				backgroundColor: "#FF0000",
				flexDirection: "row",
				height: this.Dimensions.ACTION_BTN_HEIGHT,
				justifyContent: "center",
				padding: 8,
				position: "absolute",
				top: this.Dimensions.STATUS_BAR_HEIGHT,
				width: Display.width
			};
			
			let StatusOptions = (nextStatuses && nextStatuses.length > 0) ? 
				<View style={this._styles.usStep}>
      		<Text style={this._styles.headerText}>1. Choose a status</Text>
      		{nextStatuses.map((nextStatus) => this._renderStatus(nextStatus))}
      	</View> :
      	<View style={this._styles.usStep}>
      		<Text style={this._styles.headerText}>You are all done!</Text>
      	</View>

			return (
				<Modal
					animation={false}
					visible={state.scenes.finalize}>
					<View style={this._styles.updateStatusBox}>
						<PreApproval
							approverOrgTypeIds={!props.statusToApprove ? null : _.invert(props.statusToApprove.accessRights.approve, true).true}
							currentSiteRight={currentSiteRight}
							currentUser={props.currentUser}
							issue={issue}
							setWorkflowStage={this._setWorkflowStage}
							statusToApprove={props.statusToApprove}
							style={approvalStyle}
							visible={this._showPreApproval}
							workflowMessages={this._workflowMessages} />
						<LineSeparator vertMargin={4} height={0} />
						<Signature
							approval={oldApproval || state.approvals.fresh}
							imgHost={props.imgHost}
							needsApproval={needsApproval}
							readOnly={oldApproval !== undefined && oldApproval !== null}
							setApprovalProperty={this._setApprovalProperty}
							themeColors={themeColors} />
						<LineSeparator vertMargin={4} height={0} />
						<Approver
							chosenStatus={state.chosenStatus}
							imgHost={props.imgHost}
							needsApproval={needsApproval}
							oldApproval={oldApproval}
							issue={props.issue}
							setApproval={this._setApproval}
							setApprovalProperty={this._setApprovalProperty}
							siteRight={currentSiteRight}
							sites={props.sites}
							themeColors={themeColors}
							users={state.users} />
						<LineSeparator vertMargin={10} height={0.5} />
	        	{StatusOptions}
	        	<LineSeparator vertMargin={8} height={0} />
				    <ActionButtons
							cancel={() => this._toggleScene("finalize", false)}
							inputChanged={state.canSave}
							saveData={() => this._saveStatus(chosenStatus)}
							showDoneBtn={true}
							style={this._styles.actionButtons}
							themeColor={themeColors[currentSiteRight.orgTypeId]} />
						<Pending
							workflowMessages={this._workflowMessages}
							workflowStages={state.workflowStages}
							setDone={() => this._setWorkflowStage("save", 0)}
							style={this._styles.settingStatus} />
					</View>
	      </Modal>
			);
		} else {
			// HAS NOTHING TO DO WITH MANUALLY GETTING PRE-APPROVAL
			if (!nextStatuses || nextStatuses === null || nextStatuses.length < 1)
				return null;
			else {
				let styles = StyleSheet.create({
					initUpdateBtn: {
						backgroundColor: "#FFFFFF",
						borderColor: "#000000",
						borderRadius: 4,
						borderWidth: 0.5,
						flex: 1,
						margin: 4,
						paddingHorizontal: 10,
						paddingVertical: 6
					}, iubText: {
						fontFamily: "System",
						fontSize: 22,
						textAlign: "center",
					},
				})
				, statuses = props.statuses
				, lastStatus = statuses[props.statusEntry.statusId]
				, approverOrgType = !lastStatus.needsApproval ? undefined : this.getApproverOrgType(lastStatus)
				, themeColor = approverOrgType ? themeColors[approverOrgType] : undefined;

				/* if there one of the next status refs has an approval param (that can
				be transacted by current user, then change button word to "APPROVE") */
				return (
					<View onLayout={props.setBtnDims}>
						<TouchableHighlight
							onPress={() => this._toggleScene("finalize", true)}
							style={styles.initUpdateBtn}>
							<Text style={ [styles.iubText, {color: themeColors[currentSiteRight.orgTypeId]}] }>UPDATE</Text>
						</TouchableHighlight>
					</View>
				);
			}
		}
	}
});

module.exports = NextStatuses;