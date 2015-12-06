'use strict';

// REACT PARTS
var NavBtn = require("react-native-button");
var Collapsible = require('react-native-collapsible/Collapsible');
var Display = require("react-native-device-display");
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var React = require("react-native");
// var Signature = require('react-native-signature-capture');

// COMPONENTS
var Invoicing = require("../Comps/Invoicing");
var HistoryScene = require("./HistoryScene");
var InputHelperScene = require("./InputHelperScene");
var LineSeparator = require("../Comps/LineSeparator");
var MapScene = require("./MapScene");
var NavBarTitle = require("../Comps/NavBarTitle");
var Popover = require('react-native-popover');
var IssueInfoScene = require("./IssueInfoScene");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var _ = require("lodash");

var {
	ActionSheetIOS,
	ListView,
	Modal,
 	Navigator,
 	SegmentedControlIOS,
	StyleSheet,
	Text,
	TextInput,
	TouchableHighlight,
	View
} = React;

var BaseConfig = Navigator.SceneConfigs.FloatFromRight
var CustomLeftToRightGesture = _.assign({}, BaseConfig.gestures.pop, {
  snapVelocity: 2,
  edgeHitWidth: Display.width
});

var CustomSceneConfig = _.assign({}, BaseConfig, {
  springTension: 80,
  springFriction: 3,
  gestures: {
    pop: CustomLeftToRightGesture
  }
});

var styles = StyleSheet.create({
	mainBox: {
		flex: 1,
		opacity: 1.0
	},
	main: {
		flex: 1,
	},
	navBarTitle: {
		alignItems: "center",
		alignSelf: "center",
		flex: 8,
		justifyContent: "center",
		width: Display.width * 0.65,
	},
	navBtn: {
		color: "#FFFFFF",
		marginHorizontal: 12,
		flex: 2,
		fontSize: 30,
		justifyContent: "center",
		textAlign: "center"
	},
	close: {
		position: "absolute",
		bottom: 0
	}
});

var RDMain = React.createClass({
	mixins: [IssueMixin, SiteMixin, ViewMixin],
	_pendingTodoItems: null,
	_loaded: false,
	_prevGeoPoint: null,
	_issueRef: null,
	_sites: {
		client: null,
		police: null,
		security: null,
		vendor: null
	},

	getInitialState: function() {
		let props = this.props.route.passProps;
		
		return {
			btnRect: {},
			context: props.context,
			dims: props.dims,
			imageDims: null,
			nav: null,
			issue: _.cloneDeep(props.issue),
			scenes: null,
			sceneIndex: 0,
			showPopover: false,
			signature: false
		};
	},

	componentWillMount: function() {
		var issue = this.state.issue;
		var sites = this.props.sites;

		// *** NEED TO REDO:  1) ready from issue itself, otherwise 2) look @ client allies
		this._sites[this._orgTypeIds.CLIENT] = this._getSite(this._orgTypeIds.CLIENT);
		this._sites[this._orgTypeIds.VENDOR] = this._getSite(this._orgTypeIds.VENDOR);
		this._sites[this._orgTypeIds.SECURITY] = this._getSite(this._orgTypeIds.SECURITY);
		this._sites[this._orgTypeIds.POLICE] = this._getSite(this._orgTypeIds.POLICE);
		this._refreshPendingTodoItems(issue.todoMap);
		this._issueRef = this.props.db.child("issues").child(issue.iid);
			
		// listener for any changes to current issue
		this._issueRef.on("child_changed", (snap) => {
			this._updateIssue(snap);
		});

		this._issueRef.on("child_added", (snap) => {
			if (!this._loaded)
				return;

			this._updateIssue(snap);
		});
	},

	componentWillUpdate: function(newProps, newState) {
		if ( !_.eq(newState.issue.todoMap, this.state.issue.todoMap) )
			this._refreshPendingTodoItems(newState.issue.todoMap);
	},

	componentWillUnmount: function() {
		/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			Find out how to  prevent re-rendering when this component unmounts
		!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
		this._issueRef.off();
	},

	componentDidMount: function() {
		this._loaded = true;
	},

	shouldComponentUpdate: function(newProps, newState) {
  	var oldProps = this.props, oldState = this.state;
  	var stateChanged = false;

  	if ( !_.eq(newProps.issues, oldProps.issues) )
  		stateChanged = false;
  
  	if ( !_.eq(newState.issue, oldState.issue) )
  		stateChanged = true;
  	else
  		stateChanged = true;

  	return stateChanged;
  },

	_changeScene: function(e) {
		var newSceneIndex = e.nativeEvent.selectedSegmentIndex;
		if (this.state.sceneIndex != newSceneIndex)
			this.setState({
				sceneIndex: newSceneIndex,
			});
	},

	_getSite: function(orgTypeId) {
		var issue = this.state.issue
			, sites = this.props.sites;
	
		var siteId = _.has(issue.sites, orgTypeId) ? issue.sites[orgTypeId].siteId : null;
		
		if ( _.isEmpty(siteId) ) {
			var site = _.findWhere(this._sites[this._orgTypeIds.CLIENT].allies, {"isActive": true, "orgTypeId": orgTypeId});
			siteId = site ? site.id : null;
		}

		return _.isEmpty(siteId) ? null : sites[orgTypeId][siteId];
	},

	_goToScene: function(index) {
		this._momentary = true;
		this.setState({
			sceneIndex: index
		});
	},

	// _moveInput: function(viewRef, targetRef, offset) {
 //    let scrollResponder = viewRef.getScrollResponder();
 //    let nodeHandle = React.findNodeHandle(targetRef);
 //    scrollResponder.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, offset);
 //  },

	_openMap: function(themeColors) {
		if ((this._prevGeoPoint != null)
			&& ( _.matches(this._prevGeoPoint, this.state.issue.geoPoint) ))
			this.props.navigator.jumpForward();
		else {
			var route = {
			  component: MapScene,
			  passProps: {
			  	currentSiteRight: this.props.currentSiteRight,
			  	dims: this.state.dims,
			  	issue: this.state.issue,
			  	sites: this._sites,
			  	themeColors: themeColors
			  },
			  transitionType: "FloatFromBottom"
			};
			
			this.props.navigator.push(route);
			this._prevGeoPoint = this.state.issue.geoPoint;
		}
	},

	_openAssistedInput: function(imgTypeId, params, inputValue) {
		let props = this.props, state = this.state;
		let route = {
		  component: InputHelperScene,
		  passProps: {
		  	db: props.db,
		  	imgTypeId: imgTypeId,
		  	inputValue: inputValue,
		  	lookups: props.lookups,
		  	params: params,
		  	prevImg: _.findWhere(state.issue.images, {"imgTypeId": imgTypeId}),
		  	issue: state.issue,
		  	sceneDims: state.dims,
		  	themeColor: props.lookups.orgTypes[props.currentSiteRight.orgTypeId].color
		  },
		  transitionType: "FloatFromBottom"
		};

		this.props.navigator.push(route);
	},

	_refreshPendingTodoItems: function(todoMap) {
		this._pendingTodoItems = _.where(todoMap, {done: false});
	},

	_setDims: function(e) {
		if (this.state.dims == null) {
			var layout = e.nativeEvent.layout; 
			
			this.setState({
				dims: {
					height: layout.height,
					width: layout.width,
				}
			});
		} else
			return;
  },

  _togglePopover: function(state) {
  	if (!this.state.showPopover && state === true)
	  	this.refs.print._root.measure((ox, oy, width, height, px, py) => {
	  		this.setState({
	  			showPopover: state,
	  			btnRect: {x: px, y: py, width: width, height: height}
	  		});
	  	});
	 	else
	 		this.setState({showPopover: state});
  },

  _updateIssue: function(snap) {
		console.log("Tow issue has been updated");
		var issue = this.state.issue;
		issue[snap.key()] = snap.val();

		this.setState({
			issue: issue
		});
  },

	_renderScene: function(route, nav) {	
		var navBar = null
			, props = this.props.route.passProps
			, issue = this.state.issue
			, Scene
			, themeColors = props.themeColors
			, users = this.props.users;

		if (route.navigationBar) {
		 	navBar = React.addons.cloneWithProps(route.navigationBar, {
		  	navigator: nav,
		  	route: route
		 	});
		}

		switch (this.state.sceneIndex) {
			case 1:
				Scene =
					<HistoryScene
	   				context="all"
	   				currentSiteRight={this.props.currentSiteRight}
	   				currentUser={this.props.currentUser}
	   				ds={ new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}) }
	   				lookups={this.props.lookups}
	   				nav={nav}
	   				issue={issue}
	   				sites={this._sites}
	   				statusLookups={this.props.lookups.statuses}
	   				themeColors={themeColors}
	   				users={users} />

			break;

			default:
				Scene =
					<IssueInfoScene
						currentSiteRight={_.cloneDeep(this.props.currentSiteRight)}
						currentUser={this.props.currentUser}
						dims={props.dims}
						lookups={this.props.lookups}
						nav={nav}
						openMap={this._openMap}
						issue={issue}
						sites={this._sites}
						themeColors={themeColors}
						users={users} />
			break;
		}

		return (
			<View style={styles.mainBox}>
				{navBar}
		   	<View
		   		style={styles.main}
		   		onLayout={this._setDims}>
		   		{Scene}
		   	</View>
		   	<Popover
          isVisible={this.state.showPopover}
          fromRect={this.state.btnRect}
          onClose={this._processPopover}>
          <Invoicing
          	clientSite={this._sites[this._orgTypeIds.CLIENT]}
          	close={() => this._togglePopover(false)}
          	currentSiteRight={this.props.currentSiteRight}
          	lookups={this.props.lookups}
          	pendingTodoItems={this._pendingTodoItems}
          	issue={issue}
          	sites={this.props.sites}
          	showDocumentOptions={this._showDocumentOptions}
          	themeColors={themeColors} />
        </Popover>
			</View>
		);
	},

	_configureScene: function() {
		return CustomSceneConfig;
	},

	_saveSignature: function(result) {
		console.log(result);
	},

	_showSignature: function(state) {
		this.setState({
			signature: state
		});
	},

	render: function() {
		var props = this.props.route.passProps;
		var themeColor = props.themeColors[this.props.currentSiteRight.orgTypeId];
		var backBtn =
			<NavBtn onPress={this.props.navigator.pop}>
				<Icon name={"arrow-left-a"} style={styles.navBtn} />
			</NavBtn>;

		var invoiceBtn =
			<NavBtn onPress={() => this._togglePopover(true)}>
				<Icon ref="print" name={"document-text"} style={styles.navBtn} />
			</NavBtn>;

		var navBarTitle =
			<SegmentedControlIOS
				enabled={true}
				onChange={this._changeScene}
				selectedIndex={this.state.sceneIndex}
				style={styles.navBarTitle}
				tintColor={this.Colors.night.section}
				values={["Home", "History"]} />

		var navBar =
			<NavBar
				backgroundColor={themeColor}
				customNext={invoiceBtn}
				customPrev={backBtn}
				nextTitle="Print"
				prevTitle="Back"
				customTitle={navBarTitle} />

		if (this.state.signature)
			return (
				<Modal
					animation={false}
					visible={this.state.signature}>
					<Signature onSaveEvent={this._saveSignature} />
					<TouchableHighlight
						underlayColor="#A4A4A4"
						onPress={() => this._showSignature(false)}
						style={styles.close}>
						<View>
							<Text>Cancel</Text>
						</View>
					</TouchableHighlight>
				</Modal>
			);
		else {
			return (
				<Navigator
					configureScene={this._configureScene}
					renderScene={this._renderScene}
					initialRoute={{
					  navigationBar: navBar,
					  themeColors: props.themeColors
					}} />
			);
		}
	}
});

module.exports = RDMain;