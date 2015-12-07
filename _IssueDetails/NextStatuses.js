'use strict';

// REACT PARTS
var Collapsible = require('react-native-collapsible/Collapsible');
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");
var TimerMixin = require('react-timer-mixin');

// COMPONENTS
var ActionButtons = require("../Comps/ActionButtons");
var LineSeparator = require("../Comps/LineSeparator");
var Pending = require("../Comps/Pending");
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
		lookups: PropTypes.object,
		issue: PropTypes.object,
		setBtnDims: PropTypes.func,
		site: PropTypes.object,
		statusEntry: PropTypes.object,
		themeColor: PropTypes.string
	},
	mixins: [Reflux.ListenerMixin, Reflux.connect(UserStore), IssueMixin, SiteMixin, ViewMixin],
	_currentWorkflow: "save",
	_notes: "",
	_workflowMessages: ["Waiting to Save", "Trying to Save...", "New status saved!", "Error: Couldn't save"],
	_styles: StyleSheet.create({
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
	},

	componentWillUpdate: function(newProps, newState) {
		let oldProps = this.props, oldState = this.state;

		if ( !_.eq(oldProps.currentUser.state.issueId, newProps.currentUser.state.issueId)
			|| !_.eq(oldProps.currentSiteRight, newProps.currentSiteRight)
			|| !_.eq(oldProps.statusEntry, newProps.statusEntry) ) {
			this._refreshData(newProps);
		}
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
		let props = this.props
			, lookups = props.lookups
			, issue = props.issue;

  	// 1b. Add status to existing hazard issue
  	IssueActions.addStatus.triggerPromise(nextStatus, issue, this._notes, props.site)
			.then(() => {
				// Post add steps:
				// 1. Reset this._notes to empty string
				// self._notes = "";

				this._setWorkflowStage("save", 2);
			}).catch((err) => {
				console.log("Could not add status");
			});
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
				onPress={ () => this.setStatus({ chosenStatus: nextStatus }) }>
				<View style={this._styles.statusEntry}>
					{IndicatorIcon}
					<View style={this._styles.itemBox}>{StatusText}</View>
				</View>
			</TouchableHighlight>
		);
	},

	render: function() {
		let props = this.props, state = this.state
			, nextStatuses = state.nextStatuses
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
			let StatusOptions = ( !_.isEmpty(nextStatuses) ) ? 
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
						<LineSeparator vertMargin={10} height={0.5} />
	        	{StatusOptions}
	        	<LineSeparator vertMargin={8} height={0} />
	        	<ActionButtons
							cancel={() => this._toggleScene("finalize", false)}
							inputChanged={ !_.isEmpty(state.chosenStatus) }
							saveData={() => this._saveStatus(state.chosenStatus)}
							showDoneBtn={true}
							style={this._styles.actionButtons}
							themeColor={props.themeColor} />
						<Pending
							workflowMessages={this._workflowMessages}
							workflowStages={state.workflowStages}
							setDone={() => this._setWorkflowStage("save", 0)}
							style={this._styles.settingStatus} />
					</View>
	      </Modal>
			);
		} else {
			if ( _.isEmpty(nextStatuses) )
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
				});

				/* if there one of the next status refs has an approval param (that can
				be transacted by current user, then change button word to "APPROVE") */
				return (
					<View onLayout={props.setBtnDims}>
						<TouchableHighlight
							onPress={() => this._toggleScene("finalize", true)}
							style={styles.initUpdateBtn}>
							<Text style={ [styles.iubText, {color: props.themeColor}] }>UPDATE</Text>
						</TouchableHighlight>
					</View>
				);
			}
		}
	}
});

module.exports = NextStatuses;