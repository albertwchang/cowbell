'use strict';

// REACT PARTS
var Display = require("react-native-device-display");
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var NavBtn = require("react-native-button");
var React = require("react-native");
var Reflux = require("reflux");

// CONTEXT
var IssueDetails = require("../_IssueDetails/IDMain");

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");
var MenuSelect = require("../Comps/MenuSelect");
var NavItem = require("../Comps/NavItem");
var Popover = require('react-native-popover');

// MIXINS
var SiteMixin = require("../Mixins/Site");
var IssueMixin = require("../Mixins/Issue");
var ViewMixin = require("../Mixins/View");

// SCENES
var IssueListScene = require("./IssueListScene");
var IssueMapScene = require("./IssueMapScene");

// ACTIONS && STORES
var ProfileActions = require("../Actions/ProfileActions");
var IssueActions = require("../Actions/IssueActions");
var IssueStore = require("../Stores/IssueStore");
var SiteActions = require("../Actions/SiteActions");
var UserActions = require("../Actions/UserActions");
var UserStore = require("../Stores/UserStore");

// UTILITIES
var Moment = require("moment");
var _ = require("lodash");

var {
	ActivityIndicatorIOS,
	AlertIOS,
	Image,
	ListView,
	Modal,
 	Navigator,
 	PropTypes,
	StyleSheet,
	TabBarIOS,
	TouchableHighlight,
	Text,
	View,
} = React;

var styles = StyleSheet.create({
	mainBox: {
		flex: 1
	},
	loading: {
    flex: 1,
    alignSelf: 'center',
  },
	sceneBox: {
		backgroundColor: "#000000",
		// height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT - ViewMixin.Dimensions.NAV_BAR_HEIGHT - ViewMixin.Dimensions.TAB_BAR_HEIGHT,
		flex: 1,
		flexDirection: "column",
		justifyContent: "center",
		padding: 4,
		// top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT + ViewMixin.Dimensions.NAV_BAR_HEIGHT,
		width: Display.width - 12
	},
	navBar: {
		backgroundColor: "#DF7401"
	}, navBtn: {
		color: "#FFFFFF",
		marginHorizontal: 10,
		fontSize: 32,
		textAlign: "center"
	},
	optionBtn: {
		borderColor: "#A4A4A4",
		borderRadius: 4,
		borderWidth: 1,
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		margin: 4,
		padding: 10
	}, optionIcon: {
		color: "#FFFFFF",
		flex: 1,
		fontSize: 32,
		justifyContent: "center"
	}, stBox: {
		flex: 4
	}, optionText: {
		color: "#FFFFFF",
		fontSize: 28,
		justifyContent: "center",
		textAlign: "justify"
	},
	text: {
		color: "#FFFFFF",
		flex: 1,
		textAlign: "center",
	}
});

var BaseConfig = Navigator.SceneConfigs.FloatFromRight
var CustomLeftToRightGesture = _.assign({}, BaseConfig.gestures.pop, {
  snapVelocity: 6,
  edgeHitWidth: Display.width
});

var CustomSceneConfig = _.assign({}, BaseConfig, {
  springTension: 50,
  springFriction: 5,
  gestures: {
    pop: CustomLeftToRightGesture
  }
});

var RLMain = React.createClass({
	mixins: [Reflux.ListenerMixin , Reflux.connect(IssueStore), Reflux.connect(UserStore)
				, IssueMixin, SiteMixin, ViewMixin],
	propTypes: {
		currentUser: PropTypes.object,
		currentSiteRight: PropTypes.object,
		db: PropTypes.object,
		lookups: PropTypes.object,
		sites: PropTypes.object,
		themeColor: PropTypes.string
	},
	_nav: null,
	prevIssue: null,
	_scenes: {
		map: IssueMapScene,
		list: IssueListScene
	},
	
	getInitialState: function() {
		return {
			btnRect: {},
			dims: null,
			gettingData: true,
			nowScene: "list",
			showFilter: false,
			searchBar: false
		}
	},

	componentWillMount: function() {
		this._reloadIssues().then((results) => {
			this.setState({ gettingData: false });
		});
	},

	componentWillUnmount: function() {
		console.log("Summary Context unMounted");
	},

	shouldComponentUpdate: function(newProps, newState) {
		let updateStatus = false;

		if (newState.gettingData || !newState.users[newProps.currentSiteRight.siteId])
			updateStatus = false;
		else if ( !_.eq(newState, this.state) || !_.eq(newProps, this.props));
			updateStatus = true;

		return updateStatus;
	},

	_changeScene: function(scene) {
		if (scene === "map")
			AlertIOS.alert("Stay Tuned!", "Map coming soon...", [
		    {text: 'Okay'}
		  ]);

		this.setState({nowScene: scene});
	},

	_openIssue: function(issue) {
  	let route = {
		  component: IssueDetails,
		  passProps: {
		  	context: "one",
		  	dims: this.state.dims,
		  	omitProps: ["issues"],
		  	issue: issue,
		  	themeColor: this.props.themeColor
		  }
		};

		this._nav.push(route);
  },

	_reloadIssues: function() {
		let props = this.props;
		let siteRight = props.currentSiteRight
			, orgTypes = props.lookups.orgTypes
			, employerSite = props.sites[siteRight.siteId];
		
		return new Promise((resolve, reject) => {
			IssueActions.pullIssues.triggerPromise(employerSite.issues, "site")
				.then((issues) => {
	        resolve(issues);
				}).catch((err) => {
					reject("Error getting issues");
				});
		});
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

 	_setFilter: function(filterState) {
		var filterStates = this.props.currentUser.settings.filters.statuses.states;
		_.each(filterStates, (state, key) => {
			filterStates[key] = (key === filterState) ? true : false;
		});

		ProfileActions.setFilter(filterStates);
		IssueActions.refreshIssues("site");
		this._togglePopover(false);
	},

	_togglePopover: function(state) {
  	if (state) {
  		this.refs.filter._root.measure((ox, oy, width, height, px, py) => {
	  		this.setState({
	  			showFilter: state,
	  			btnRect: {x: px, y: py, width: width, height: height}
	  		});
	  	});
  	}
  	else
  		this.setState({showFilter: state});
  },

	_toggleSearchBar: function() {
		this.setState({searchBar: !this.state.searchBar});
	},

	_renderFilter: function(option, sectionId, rowId, onIcon, offIcon) {
		var currentUser = this.props.currentUser;
		var filterChoice = _.findKey(currentUser.settings.filters.statuses.states, (value) => {
			return value;
		});

		var Content = (typeof option === "object") ?
			<View style={styles.optionBtn}>
  			{filterChoice === option.iid ? onIcon : offIcon}
      	<View style={styles.stBox}>
      		<Text style={styles.optionText}>{option.name}</Text>
      	</View>
  		</View>
  	: <View style={styles.optionBtn}>
  			{filterChoice === option ? onIcon : offIcon}
      	<View style={styles.stBox}>
      		<Text style={styles.optionText}>{option}</Text>
      	</View>
  		</View>

		return (
			<TouchableHighlight
				key={option.iid}
  			onPress={() => this._setFilter(option.iid || option)}>
  			{Content}
  		</TouchableHighlight>	
		);
	},

	_renderScene: function(route, nav) {
		let navBar, options, state = this.state, props = this.props;

		if ( !_.eq(this._nav, nav) )
			this._nav = nav;

		if (route.navigationBar) {
		 	navBar = React.addons.cloneWithProps(route.navigationBar, {
		  	navigator: nav,
		  	route: route
		 	});
		}
		
		if (state.showFilter) {
			options = _.map(this.Filters, (filter) => {
				return {
					iid: filter,
					name: _.startCase(filter)
				};
			});
		}
		
		var Scene = route.component;

		// {...this.props} includes currentUser, currentSiteRight, lookups, and themeColor
		return (
			<View style={styles.mainBox}>
		   	{navBar}
		   	{/*
		   	<Modal
	     		animated={false}
	     		transparent={true}
	     		visible={state.showFilter}>
	        <MenuSelect
	        	ds={state.ds}
	        	options={options}
	        	renderRow={this._renderFilter}
	        	style={styles.sceneBox} />
	      </Modal>*/}
		   	<View style={styles.mainBox} onLayout={this._setDims}>
			   	<Scene
			   		{...props}
	   				context="all"
	   				ds={new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid})}
	   				issues={state.issues}
	   				lookups={props.lookups}
	   				navigator={nav}
	   				openIssue={this._openIssue}
	   				reloadIssues={this._reloadIssues}
	   				route={route}
	   				showSearchBar={state.searchBar}
	   				sites={props.sites}
	   				themeColor={props.themeColor}
	   				users={state.users[props.currentSiteRight.siteId]} />
			  </View>
			  <Popover
          fromRect={state.btnRect}
          isVisible={state.showFilter}>
          <MenuSelect
	        	ds={this._ds}
	        	options={options}
	        	renderRow={this._renderFilter}
	        	style={styles.sceneBox} />
        </Popover>
			</View>
		);
	},

	render: function() {		
		let state = this.state;

		if (state.gettingData)
			return (
				<ActivityIndicatorIOS
					animating={state.gettingData}
					style={styles.loading}
					size="large" />
			);
		else {
			var issueCount = _.toArray(state.issues).length;
			var mapBtn =
				<NavBtn onPress={() => this._changeScene("map")}>
					<Icon name={"map"} style={styles.navBtn} />
				</NavBtn>;

			var filterBtn =
				<NavBtn onPress={() => this._togglePopover(true)}>
					<Icon ref="filter" name={"ios-toggle"} style={styles.navBtn} />
				</NavBtn>;

			var title =
				<NavBtn
					onPress={this._toggleSearchBar}
					style={{borderColor: "red", borderWidth: 0.75, borderRadius: 2, backgroundColor: "#FFFFFF"}}>
					<Text>Search</Text>
				</NavBtn>;
		
			var navBar =
				<NavBar
					backgroundColor={this.props.themeColor}
					buttonsColor="#FFFFFF"
					customPrev={mapBtn}
					customNext={filterBtn}
					customTitle={title}
					titleColor="#FFFFFF" />

			return (
				<Navigator
					configureScene={this._configureScene}
					renderScene={this._renderScene}
					initialRoute={{
					  navigationBar: navBar,
					  component: this._scenes[state.nowScene]
					}} />
			);
		}
	}
});

module.exports = RLMain;