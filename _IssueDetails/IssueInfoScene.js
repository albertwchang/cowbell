'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var React = require("react-native");
var Reflux = require("reflux");
var TimerMixin = require('react-timer-mixin');

// COMPONENTS
var ActionButtons = require("../Comps/ActionButtons");
var LineSeparator = require("../Comps/LineSeparator");
var NextStatuses = require("./NextStatuses");
var Pending = require("../Comps/Pending");
var IssueImages = require("../Comps/IssueImages");
var Site = require("../Comps/Site");
var StatusEntry = require("../Comps/StatusEntry");

// ACTIONS && STORES
var MapActions = require("../Actions/MapActions");
var IssueActions = require("../Actions/IssueActions");
var UserActions = require("../Actions/UserActions");

// MIXINS
var LocationMixin = require("../Mixins/Location");
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var _ = require("lodash");
var Moment = require("moment");

var {
	AlertIOS,
	MapView,
	Modal,
	PropTypes,
	ScrollView,
	StyleSheet,
	SwitchIOS,
	Text,
	TextInput,
	TouchableHighlight,
	View
} = React;

var styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	main: {
		flex: 1,
	},
});

var IssueInfoScene = React.createClass({
	mixins: [Reflux.ListenerMixin, TimerMixin, IssueMixin
				, LocationMixin, SiteMixin, ViewMixin],
	propTypes: {
		currentUser: PropTypes.object,
		currentSiteRight: PropTypes.object,
		dims: PropTypes.object,
		lookups: PropTypes.object,
		nav: PropTypes.object,
		openMap: PropTypes.func,
		issue: PropTypes.object,
		sites: PropTypes.object,
		themeColors: PropTypes.array,
		users: PropTypes.array
	},
	_setStatusNote: "",
	_styles: StyleSheet.create({
		main: {
			flexDirection: "column",
		},
		actionButtons: {
			alignItems: "center",
			bottom: 0,
			flexDirection: "row",
			height: ViewMixin.Dimensions.ACTION_BTN_HEIGHT,
			position: "absolute",
			width: Display.width
		},
	  mapSection: {
	  	borderWidth: 1.25,
	  	flex: 1,
	  },
	  primaryInfo: {
			flex: 1,
			flexDirection: "column"
		},
		settingStatus: {
			height: Display.height,
      justifyContent: "center",
      width: Display.width
		},
		section: {
			flex: 1,
			flexDirection: "column",
			marginHorizontal: 2,
			marginVertical: 4
		},
			sectionTitle: {
				fontFamily: "System",
				fontSize: 32,
				fontWeight: "200"
			}
	}),
	_timer: null,
	_workflowMessages: {
		"save": ["Waiting to Save", "Trying to Save...", "Site Information saved!", "Error: Couldn\'t save"]
	},

	getInitialState: function() {
		return {
			mapParams: null,
			// paramCopies: {
			// 	sites: _.cloneDeep(this.props.issue.sites)
			// },
			issue: null,
			requirementsMet: false,
			showMap: false,
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
		let state = _.cloneDeep(this.state);
		_.assign(state, this._refreshIssue(this.props));
		_.assign(state, this._refreshMap(this.props));
		_.assign(state, this._refreshParamCopies(state));
		this.setState(state);
	},

	componentDidMount: function() {
		this._timer = this.setTimeout(() => {
      this.setState({ showMap: true });
    }, 500);
	},

	componentWillUpdate: function(newProps, newState) {
		let oldProps = this.props, oldState = this.state, updatedState = _.cloneDeep(newState);

		if ( !_.isEqual(newProps.issue.geoPoint, oldState.issue.geoPoint) )
			_.assign(updatedState, this._refreshMap(newProps));

		if ( !_.isEqual(newProps.issue.sites, oldState.issue.sites) )
			_.assign(updatedState, this._refreshParamCopies(updatedState));

		if ( !_.isEqual(newProps.currentUser, oldProps.currentUser) || !_.isEqual(newProps.currentSiteRight, oldProps.currentSiteRight) )
			_.assign(updatedState, this._refreshissue(newProps));

		if ( !_.isEqual(newProps.issue, oldState.issue) )
			_.assign(updatedState, this._refreshIssue(newProps));

		if ( !_.isEqual(updatedState, newState) )
			this.setState(updatedState);
	},

	componentWillUnmount: function() {
		this.clearTimeout(this._timer);
	},

	_moveInput: function(targetRef, offset) {
    let scrollResponder = this.refs.scrollView.getScrollResponder();
    let nodeHandle = React.findNodeHandle(targetRef);
    scrollResponder.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, offset);
  },

	_refreshMap: function(newProps) {
		let geoPoints = new Array(newProps.issue.geoPoint)
			, mapParams = this.getMapParams(geoPoints, newProps.dims);
		
		_.assign(mapParams, {
			"annotations": [{
				latitude: newProps.issue.geoPoint.lat,
				longitude: newProps.issue.geoPoint.long,
				hasLeftCallout: false,
			}]
		});
	
		/********************************************************************
			!!!!!!!! NEED TO SOURCE ChosenState FROM USER SETTINGS !!!!!!!!!
		********************************************************************/

		return {
			mapParams: mapParams,
			requirementsMet: true
		};
	},

	_refreshParamCopies: function(state) {
		return { paramCopies: {sites: _.cloneDeep(state.issue.sites)} };
	},

	_refreshIssue: function(props) {
		return { issue: _.cloneDeep(props.issue) };
	},

	_setParamCopies: function(newData, param) {
		let paramCopies = _.cloneDeep(this.state.paramCopies);
		paramCopies[param] = newData;
			
		this.setState({ paramCopies: paramCopies });
	},

	_saveSites: function() {
		this._setWorkflowStage("save", 1);
		let qSites = [];

		_.each(this.state.paramCopies.sites, (site, key) => {
			if ( !_.isEqual(this.state.issue.sites[key], site) )
				qSites.push(IssueActions.setParam.triggerPromise(this.props.issue, ["sites", key], site));
		});

		new Promise.all(qSites).then((results) => {
			console.log("New data saved to Firebase...");
			this._setWorkflowStage("save", 2);
		}).catch((err) => {
			console.log("Problem saving to Firebase: ", err);
			this._setWorkflowStage("save", 3);
		})
	},

	_setWorkflowStage: function(workflow, level) {
    this._currentWorkflow = workflow;
    let workflowStages = _.map(this.state.workflowStages, (stage) => {
      stage.isActive = false;
      return stage;
    });

    let dataChanged = this.state.dataChanged;
    
    workflowStages[level].isActive = true;
    if (workflowStages[level].end)
    	dataChanged = false;
    
    this.setState({ 
    	dataChanged: dataChanged,
    	workflowStages: workflowStages
    });
  },

	render: function() {
		let props = this.props, state = this.state
			, currentSiteRight = props.currentSiteRight
			, currentUser = props.currentUser
			, dims = props.dims
			, lookups = props.lookups
			, mapParams = state.mapParams
			, issue = state.issue
			, sites = _.omit(props.sites, _.isEmpty)
			, themeColors = props.themeColors
	  	, imgUris = _.pluck(issue.images, "uri")
	  	, lastStatusEntry = _.last(issue.statusEntries)
	  	, MapSection = state.showMap && state.mapParams
		  	? <MapView
		  			annotations={mapParams.annotations}
		  			region={mapParams.region}
		  			rotateEnabled={false}
		  			scrollEnabled={false}
		  			style={{height: dims.width / this.AspectRatios["21x9"], width: dims.width}}
						zoomEnabled={false}>
					</MapView>
				: null;
		
		let statusEntryStyle = StyleSheet.create({
			main: {
				backgroundColor: themeColors[currentSiteRight.orgTypeId],
				flexDirection: "row",
				alignItems: "center"
			},
			info: {
				flex: 1,
				flexDirection: "row",
				height: this.Dimensions.ACTION_BTN_HEIGHT,
				paddingHorizontal: 8
			},
			status: {
				alignSelf: "center",
				color: "#FFFFFF",
				fontSize: 26,
				fontFamily: "System",
				letterSpacing: 1
			}
		});

		let viewHeight = Display.height - this.getInnerView() - this.Dimensions.ACTION_BTN_HEIGHT

		return (
			<View style={ [this._styles.main] }>				
		   	<ScrollView
		   		contentInset={{top: -(this.Dimensions.STATUS_BAR_HEIGHT)}}
		   		keyboardShouldPersistTaps={false}
		   		ref="scrollView"
	        scrollEventThrottle={200}
	        style={{height: viewHeight}}>
					<View style={this._styles.primaryInfo}>
						<IssueImages
			   			aspectRatio={16/10}
			   			imgHost={lookups.hosts["images"]}
							uris={imgUris} />
						<LineSeparator vertMargin={4} height={0} />
						<TouchableHighlight
							underlayColor="#A4A4A4"
							onPress={() => props.openMap(themeColors)}>
							<View style={{borderColor: themeColors[currentSiteRight.orgTypeId]}}>
					  		{MapSection}
							</View>
						</TouchableHighlight>
						<LineSeparator height={0} horizMargin={0} vertMargin={4} />
						<Sites
							currentSiteRight={currentSiteRight}
							lookups={lookups}
							moveInput={this._moveInput}
							setSiteEntries={(updatedSites) => this._setParamCopies(updatedSites, "sites")}
							siteEntriesCopy={state.paramCopies.sites}
							sites={sites}
							themeColors={themeColors}
							updateSiteEntries={(siteEntries, param) => this._setParamCopies(siteEntries, param)} />
					</View>
				</ScrollView>
				<LineSeparator color="#FFFFFF" height={0.8} horzMargin={0} vertMargin={0} />
				<StatusEntry
					currentUser={props.currentUser}
        	currentSiteRight={currentSiteRight}
					lookups={lookups}
					issue={issue}
					show={{status: true, update: true}}
					sites={sites}
					statusEntry={lastStatusEntry}
					styles={statusEntryStyle}
					themeColors={themeColors}
					users={props.users} />
				<ActionButtons
					cancel={ () => this.setState(this._refreshParamCopies(state)) }
					inputChanged={!_.isMatch(state.paramCopies["sites"], props.issue.sites)}
					saveData={this._saveSites}
					style={this._styles.actionButtons}
					themeColor={themeColors[currentSiteRight.orgTypeId]} />
			</View>
		);
	}
});


/***************************************************************************************************
*********************************** S I T E S    S E C T I O N **************************************
***************************************************************************************************/
var Sites = React.createClass({
	mixins: [IssueMixin, ViewMixin],
	propTypes: {
		currentSiteRight: PropTypes.object,
		lookups: PropTypes.object,
		moveInput: PropTypes.func,
		setSiteEntries: PropTypes.func,
		siteEntriesCopy: PropTypes.object,
		sites: PropTypes.object,
		themeColors: PropTypes.array
	},
	_TodoViews: null,
	_styles: StyleSheet.create({
		main: {
			borderWidth: 0.5,
			flex: 1,
			flexDirection: "column",
			marginBottom: 14,
			padding: 4
		}, site: {
				flex: 1,
				flexDirection: "row",
				paddingVertical: 2
			},
			todoItemHorz: {
				flex: 1,
				flexDirection: "row",
				padding: 6
			}, todoTitleHorz: {
					flex: 5
				},
				todoValueHorz: {
					flex: 1,
					justifyContent: "center"
				},
				
			todoItemVert: {
				flex: 1,
				flexDirection: "column",
				paddingVertical: 6
			}, 
				todoTitleVert: {
					borderColor: "#A4A4A4",
					flex: 1,
					paddingBottom: 2,
					paddingHorizontal: 6
				},
				todoValueVert: {
					flex: 1,
					paddingHorizontal: 6,
					paddingVertical: 2
				},
					
			ttText: {
				color: "#E8E8E8",
				fontFamily: "System",
				fontSize: 18,
				fontWeight: "200"
			},
			tvText: {
				fontFamily: "System",
				fontWeight: "200",
				letterSpacing: 2
			}
	}),

	getInitialState: function() {
		return { showWhenMgr: false };
	},

	componentWillMount: function() {
		this._TodoEntrySets = _.mapValues(this.props.sites, () => {
			return null;
		});

		this._resetSiteEntriesCopy(this.props);
	},

	componentWillUpdate: function(newProps, newState) {
		_.each(newProps.siteEntriesCopy, (newSiteEntry) => {
			if ( !_.eq(newSiteEntry, this.props.siteEntriesCopy[newSiteEntry.orgTypeId]) )
				this._buildTodoSet(newProps, newSiteEntry);
		});
	},

	_buildTodoSet: function(props, siteEntry) {
		let currentSiteRight = props.currentSiteRight
			, lookups = props.lookups
			, siteOrgTypeId = siteEntry.orgTypeId
			, todoSet = lookups.orgTypes[siteOrgTypeId].todos;
		
		this._TodoEntrySets[siteOrgTypeId] = {
			done: this.isDone(_.pluck(siteEntry.todoItems, "value")),
			view: !_.isEmpty(todoSet) && _.contains( _.property(["accessRights", "read"])(todoSet), currentSiteRight.orgTypeId )
				?	<TodoSet
		        editable={_.contains(todoSet.accessRights.write, currentSiteRight.orgTypeId)}
		        key={siteOrgTypeId}
		        moveInput={props.moveInput}
		        orgType={lookups.orgTypes[siteOrgTypeId]}
		        setTodo={(newSet, path) => this._setTodoSet(newSet, path, siteOrgTypeId)}
		        siteRight={currentSiteRight}
		        todoEntrySet={siteEntry.todoItems}
		        todoSet={todoSet.options} />
		   	: null
		 }
	},

	_resetSiteEntriesCopy: function(props) {
		_.each(props.siteEntriesCopy, (siteEntry) => {
			this._buildTodoSet(props, siteEntry);
		});
	},

	_setTodoSet: function(newSet, path, orgTypeId) {
		let siteEntriesCopy = _.cloneDeep(this.props.siteEntriesCopy);
		if ( !_.isMatch(newSet, siteEntriesCopy[orgTypeId].todoItems) ) {
			
			_.set(siteEntriesCopy, path, newSet);
			this.props.setSiteEntries(siteEntriesCopy, "sites");
		}
	},

	// Scroll a component into view. Just pass the component ref string.
	_toggleShowWhenMgr: function(state, setState) {
		this.state.showWhenMgr = state;

		if (setState)
			this.setState(this.state);
		else
			return true;
	},

	render: function() {
		let props = this.props
			, lookups = props.lookups
			, siteEntriesCopy = props.siteEntriesCopy
			, themeColors = props.themeColors;
			
		return (
			<View>{_.map(siteEntriesCopy, (siteEntry) => {
				let siteOrgTypeId = siteEntry.orgTypeId
					, todoEntrySet = this._TodoEntrySets[siteOrgTypeId]
					, color = todoEntrySet.done ? themeColors[siteOrgTypeId] : this.Colors.night.border;

				return (
					<View key={siteOrgTypeId} style={ [this._styles.main, {borderColor: color}] }>
						<Site
							info={props.sites[siteOrgTypeId]}
							imgHost={lookups.hosts["images"]}
							showImg={true}
							showPhoneBtn={true}
							style={this._styles.site}
							themeColors={themeColors} />
						{todoEntrySet.view}
					</View>
				);
			})}
			</View>
		);
	}
});

module.exports = IssueInfoScene;