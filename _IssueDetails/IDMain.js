'use strict';

// REACT PARTS
var NavBtn = require("react-native-button");
var Collapsible = require('react-native-collapsible/Collapsible');
var Display = require("react-native-device-display");
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var React = require("react-native");

// COMPONENTS
// var Invoicing = require("../Comps/Invoicing");
var HistoryScene = require("./HistoryScene");
// var InputHelperScene = require("./InputHelperScene");
var LineSeparator = require("../Comps/LineSeparator");
var MapScene = require("./MapScene");
var NavBarTitle = require("../Comps/NavBarTitle");
// var Popover = require('react-native-popover');
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
	_btnRect: {},
	_ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),
	_loaded: false,
	_prevGeoPoint: null,
	_issueRef: null,

	getInitialState: function() {
		let props = this.props.route.passProps;
		
		return {
			context: props.context,
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
		let issue = this.state.issue
			, sites = this.props.sites;

		// setup listener to handle real-time updates w/ issue
		this._issueRef = this.props.host.db.child("issues").child(issue.iid);
		this._issueRef.on("child_changed", (snap) => {
			this._updateIssue(snap);
		});

		this._issueRef.on("child_added", (snap) => {
			if (this._loaded)
				this._updateIssue(snap);
			else
				this._loaded = true;
		});
	},

	componentWillUpdate: function(newProps, newState) {
		// if ( !_.eq(newState.issue.todoMap, this.state.issue.todoMap) )
		// 	this._refreshPendingTodoItems(newState.issue.todoMap);
	},

	componentWillUnmount: function() {
		this._issueRef.off();
	},

	shouldComponentUpdate: function(newProps, newState) {
  	let oldProps = this.props, oldState = this.state;
  	let stateChanged = false;

  	if ( !_.eq(newProps.issues, oldProps.issues) )
  		stateChanged = false;
  
  	if ( !_.eq(newState.issue, oldState.issue) )
  		stateChanged = true;
  	else
  		stateChanged = true;

  	return stateChanged;
  },

	_changeScene: function(e) {
		let newSceneIndex = e.nativeEvent.selectedSegmentIndex;

		if (this.state.sceneIndex != newSceneIndex)
			this.setState({
				sceneIndex: newSceneIndex,
			});
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

	_openMap: function(themeColor) {
		let props = this.props
			, passedProps = props.route.passProps
			, state = this.state
			, issue = state.issue;

		if ((this._prevGeoPoint != null)
			&& ( _.matches(this._prevGeoPoint, issue.geoPoint) ))
			props.navigator.jumpForward();
		else {
			let route = {
			  component: MapScene,
			  passProps: {
			  	currentSiteRight: props.currentSiteRight,
			  	dims: state.dims,
			  	issue: issue,
			  	site: props.sites[issue.siteId],
			  	themeColor: themeColor
			  },
			  transitionType: "FloatFromBottom"
			};
			
			props.navigator.push(route);
			this._prevGeoPoint = issue.geoPoint;
		}
	},

	_setDims: function(e) {
		if ( _.isEmpty(this.state.dims) ) {
			let layout = e.nativeEvent.layout; 
			
			this.setState({
				dims: {
					height: layout.height,
					width: layout.width,
				}
			});
		} else
			return;
  },

  _togglePopover: function(popoverState) {
  	if (!this.state.showPopover && popoverState === true)
	  	this.refs.print._root.measure((ox, oy, width, height, px, py) => {
	  		this._btnRect = {x: px, y: py, width: width, height: height};
	  		this.setState({ showPopover: popoverState });
	  	});
	 	else
	 		this.setState({showPopover: popoverState});
  },

  _updateIssue: function(snap) {
		console.log("Hazard issue has been updated");
		let issue = this.state.issue;
		issue[snap.key()] = snap.val();

		this.setState({ issue: issue });
  },

	_renderScene: function(route, nav) {	
		let navBar = null
			, props = this.props
			, passedProps = props.route.passProps
			, state = this.state
			, themeColor = props.themeColor
			, users = props.users
			, Scene;

		let site = props.sites[state.issue.siteId];

		if (route.navigationBar) {
		 	navBar = React.cloneElement(route.navigationBar, {
		  	navigator: nav,
		  	route: route
		 	});
		}

		switch (this.state.sceneIndex) {
			case 1:
				Scene =
					<HistoryScene
	   				context="all"
	   				currentSiteRight={props.currentSiteRight}
	   				currentUser={props.currentUser}
	   				ds={this._ds}
	   				lookups={props.lookups}
	   				nav={nav}
	   				issue={state.issue}
	   				site={site}
	   				themeColor={themeColor}
	   				users={users} />
			break;

			default:
				Scene =
					<IssueInfoScene
						currentSiteRight={_.cloneDeep(props.currentSiteRight)}
						currentUser={props.currentUser}
						dims={passedProps.dims}
						lookups={props.lookups}
						nav={nav}
						openMap={this._openMap}
						issue={state.issue}
						site={site}
						themeColor={themeColor}
						users={users} />
			break;
		}

		return (
			<View style={styles.mainBox}>
				{navBar}
		   	<View style={styles.main} onLayout={this._setDims}>
		   		{Scene}
		   	</View>
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
		let props = this.props
			, passedProps = props.route.passProps
			, themeColor = passedProps.themeColor;
		
		let backBtn =
			<NavBtn onPress={props.navigator.pop}>
				<Icon name={"arrow-left-a"} style={styles.navBtn} />
			</NavBtn>;

		let invoiceBtn =
			<NavBtn onPress={() => this._togglePopover(true)}>
				<Icon ref="print" name={"document-text"} style={styles.navBtn} />
			</NavBtn>;

		let navBarTitle =
			<SegmentedControlIOS
				enabled={true}
				onChange={this._changeScene}
				selectedIndex={this.state.sceneIndex}
				style={styles.navBarTitle}
				tintColor={this.Colors.night.text}
				values={["Details", "History"]} />

		let navBarStyle = {
			alignItems: "flex-end",
			backgroundColor: this.props.themeColor
		};

		let navBar =
			<NavBar
				style={this.getNavBarStyle(props.themeColor)}
				buttonsColor={this.Colors.night.text}
				customNext={invoiceBtn}
				customPrev={backBtn}
				customTitle={navBarTitle} />

		return (
			<Navigator
				configureScene={this._configureScene}
				renderScene={this._renderScene}
				initialRoute={{
				  navigationBar: navBar,
				  themeColor: passedProps.themeColor
				}} />
		);
	}
});

module.exports = RDMain;