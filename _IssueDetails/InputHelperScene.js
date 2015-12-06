var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var NavBarBtn = require('react-native-button');
var Orientation = require('react-native-orientation');
var React = require("react-native");
var Reflux = require("reflux");

// ACTIONS && STORES
var IssueActions = require("../Actions/IssueActions");

// COMPONENTS
var ActionButtons = require("../Comps/ActionButtons");
var CamMgr = require("../Comps/CamMgr");
var ImgMgr = require("../Comps/ImgMgr");
var LineSeparator = require("../Comps/LineSeparator");
var Pending = require("../Comps/Pending");

// MIXINS
var ViewMixin = require("../Mixins/View");

// Utilities
// var Moment = require('moment');
var _ = require("lodash");

var {
	AlertIOS,
	ActivityIndicatorIOS,
	Modal,
	Navigator,
	PropTypes,
	StatusBarIOS,
	StyleSheet,
	Text,
	TextInput,
	TouchableHighlight,
	View,
} = React;

var InputHelperScene = React.createClass({
	mixins: [ViewMixin],
	propTypes: {
  	db: PropTypes.object,
  	imgTypeId: PropTypes.string,
  	inputValue: PropTypes.string,
  	lookups: PropTypes.object,
  	params: PropTypes.object,
  	prevImg: PropTypes.object,
  	issue: PropTypes.object,
  	sceneDims: PropTypes.object,
  	themeColor: PropTypes.bool
	},
	_styles: StyleSheet.create({
		box: {
			flexDirection: "column",
			height: Display.height - ViewMixin.Dimensions.TAB_BAR_HEIGHT - ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			opacity: 1.0,
			top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT
		}, section: {
				flex: 1
			},
			actionButtons: {
				bottom: 0,
				flexDirection: "row",
				height: ViewMixin.Dimensions.ACTION_BTN_HEIGHT,
				position: "absolute",
				width: Display.width
			},
			header: {
				backgroundColor: "#2E2E2E",
				justifyContent: "center",
				padding: 4,
				width: Display.width
			}, headerText: {
				color: "#FFFFFF",
				fontSize: 30,
				fontWeight: "bold",
				justifyContent: "center",
				textAlign: "center"
			},

			saving: {
				height: Display.height,
	      justifyContent: "center",
	      width: Display.width
			}
	}),
	_currentWorkflow: "save",
	_workflowMessages: {
		"save": ["Waiting to Save", "Trying to Save...", "New data saved!", "Error: Couldn\'t save"]
	},
	imgType: null,

	getInitialState: function() {
		return {
			camMgrOn: false,
			inputValue: this.props.route.passProps.inputValue,
			prevImg: this.props.route.passProps.prevImg,
			workflowStages: {
				save: [
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
	    }
		}
	},

	componentWillMount: function() {
		var props = this.props.route.passProps;
		var imgTypeId = props.imgTypeId;
		var params = props.params;

		StatusBarIOS.setHidden(false);
		StatusBarIOS.setStyle("light-content");
		
		if (props.lookups != null)
			this.imgType = props.lookups.imgTypes[imgTypeId];

		// listener for any changes to current issue
		var issueId = this.props.route.passProps.issue.iid;
		var issueRef = props.db.child("issues").child(issueId);
		var self = this;

		issueRef.on("child_changed", (snap) => {
			var updatedParam = snap.key();
			var updatedResult = snap.val();
			
			switch (updatedParam) {
				case "images":
					var prevImg = _.findWhere(updatedResult, {"imgTypeId": props.imgTypeId});
					self.setState({
						prevImg: prevImg,
					});
				break;

				case "vehicle":
					_.each(props.params, (param) => {
						updatedResult = updatedResult[param];
					});

					if (updatedResult != self.state.inputValue) {
						self.setState({
							inputValue: updatedResult,
						});
					}

					// update passProps
					this.props.route.passProps.inputValue = updatedResult;
				break;

				default:
				break;
			}
		});
	},

	componentWillUnmount: function() {
		var issueId = this.props.route.passProps.issue.iid;
		var issueRef = this.props.db.child("issues").child(issueId);
		issueRef.off("child_changed");

		/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			Find out how to  prevent re-rendering when this component unmounts
		!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
	},

	_toggleCamMgr: function(state) {
		this.setState({
			camMgrOn: state,
		});
	},

	_saveInputValue: function() {
		var props = this.props.route.passProps;

		// Confirm current inputValue != prev inputValue prior to updating vehicleCopy
		if (this.state.inputValue !== props.inputValue) {
			this._setWorkflowStage("save", 1);
			let path = props.params;
			path.push("value");

			IssueActions.updateVehicle.triggerPromise(props.issue.iid, path, this.state.inputValue)
				.then(() => {
					this._setWorkflowStage(this._currentWorkflow, 2);
				}).catch((err) => {
					console.log("Problem: ", err);
					this._setWorkflowStage(this._currentWorkflow, 3);
				});
		} else
			return;
	},

	_setImg: function(stagedImg) {
    /*******************************************************************
     Images will be pushed to Firebase, specifically the issue's image
     array.  The stagedImg object will be pushed into the images array.
     This process requires the following steps:

     1. Get existing S3 Policy
     2. Ready 2 objects
     		a. stagedImg obj
     		b. issue.images obj
     3. Upload stagedImg to Amazon S3
     4. Upload img obj to Firebase
    *******************************************************************/
  	return IssueActions.recordImg.triggerPromise(this.props.route.passProps.issue, stagedImg);
	},

	_setWorkflowStage: function(workflow, level) {
		this._currentWorkflow = workflow;
    var workflowStages = _.map(this.state.workflowStages[workflow], (stage) => {
      stage.isActive = false;
      return stage;
    });

    workflowStages[level].isActive = true;
    var newState = {};
    this.state.workflowStages[workflow] = workflowStages;
    
    _.assign(newState, this.state.workflowStages);
    this.setState(newState);
  },

	_trashImg: function() {
		var imgTypeId = this.imgType.iid
		, props = this.props.route.passProps;
		
		return IssueActions.removeFromImages.triggerPromise(props.issue, imgTypeId);
	},

	_updateInputValue: function(newValue) {
		if (newValue != this.state.inputValue)
			this.setState({
				inputValue: newValue.toUpperCase(),
			})
	},
   
	render: function() {
		var props = this.props.route.passProps
			, state = this.state
			, styles = this._styles
			, imgHost = props.lookups.hosts["images"]
			, prevImg = state.prevImg
			, issue = props.issue
			, issueId = props.issue.iid
			, workflowStages = state.workflowStages[this._currentWorkflow];

		if (state.camMgrOn) {
			return (
				<Modal
					animation={false}
					visible={state.camMgrOn}>
      		<CamMgr
      			db={props.db}
						exitCamMgr={() => this._toggleCamMgr(false)}
						imgHost={imgHost}
						imgType={this.imgType}
						issue={issue}
						lookups={props.lookups}
						prevImg={prevImg}
						issueId={issueId}
						setImg={this._setImg}
						trashImg={this._trashImg} />
	      </Modal>
			);
		} else {
			var inputChanged = state.inputValue !== props.inputValue;
			var cancelBtn =
				<TouchableHighlight
					onPress={this.props.navigator.jumpBack}>
					<View style={ [styles.actionBtn, styles.btnCancel] }>
						<Text style={styles.actionBtnText}>Cancel</Text>
					</View>
				</TouchableHighlight>

			return (
	    	<View style={styles.box}>
	    		<View style={styles.header}>
	    			<Text style={styles.headerText}>:: {this.imgType.name} ::</Text>
	    		</View>
		    	<View style={styles.section}>
		    		<Input
		    			imgType={this.imgType}
		    			inputValue={state.inputValue}
		    			searchInputValue={this._searchInputValue}
		    			updateInputValue={this._updateInputValue} />
			    	<ImgMgr
			    		allowedToEdit={true}
			    		imgHost={imgHost}
							openCameraMgr={() => this._toggleCamMgr(true)} 
							prevImgUri={state.prevImg ? state.prevImg.uri : undefined} />
					</View>
					<Modal
	    			animation={false}
	    			visible={!workflowStages[0].isActive}>
	          <Pending
	          	workflowMessages={this._workflowMessages[this._currentWorkflow]}
	            workflowStages={state.workflowStages[this._currentWorkflow]}
	            setDone={() => this._setWorkflowStage(this._currentWorkflow, 0)}
	            style={styles.saving} />
	        </Modal>
					<ActionButtons
						inputChanged={inputChanged}
						cancel={this.props.navigator.jumpBack}
						saveData={this._saveInputValue}
						showDoneBtn={true}
						style={styles.actionButtons}
						themeColor={props.themeColor} />
				</View>
			);
		}
	}
});


/*********************************************************************************
**********************************************************************************
																			I N P U T

**********************************************************************************/
var Input = React.createClass({
	mixins: [ViewMixin],
	propTypes: {
		imgType: PropTypes.object,
		inputValue: PropTypes.string,
		searchInputValue: PropTypes.func,
		updateInputValue: PropTypes.func
	},

	render: function() {
		var imgType = this.props.imgType
		var isFulfilled = imgType.lengths.required === this.props.inputValue.length;
		var styles = {
			box: {
				flex: 1,
				justifyContent: "center",
				alignSelf: "center",
			},
			inputSection: {
				borderWidth: 0.5,
				flexDirection: "row",
				height: 55,
				padding: 8,
			}, input: {
				flex: 10,
				fontFamily: "helvetica neue",
				fontSize: 25,
				fontWeight: "200",
				letterSpacing: 2,
			}, inputIcon: {
				flex: 1,
				fontFamily: "helvetica neue",
				fontSize: 25,
				textAlign: "center"
			}
		};

		return (
			<View style={styles.inputSection}>
				<TextInput
					placeholder={"Enter " +this.props.imgType.name}
					placeholderTextColor="#585858"
					maxLength={this.props.imgType.lengths.max}
					ref="input"
					onChangeText={this.props.updateInputValue}
					style={ [styles.input, isFulfilled ? this.Styles._textStyle.on : this.Styles._textStyle.off] }
					value={this.props.inputValue} />{isFulfilled
			? <Icon
					name={"ios-checkmark"}
					style={[styles.inputIcon, this.Styles._textStyle.on]} />
			: <Text style={styles.inputIcon}></Text>}
			</View>
		);
	}
});

module.exports = InputHelperScene;