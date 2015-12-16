'use strict';

// REACT PARTS
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var NavBtn = require("react-native-button");
var React = require("react-native");
var Reflux = require("reflux");
var TimerMixin = require('react-timer-mixin/TimerMixin');

// COMPONENTS
var MapActions = require("../Actions/MapActions");
var LookupStore = require("../Stores/LookupStore");
var MapStore = require("../Stores/MapStore");
var SiteStore = require("../Stores/SiteStore");
var NavBarTitle = require("../Comps/NavBarTitle");
var NavItem = require("../Comps/NavItem");

// MIXINS
var SiteMixin = require("../Mixins/Site");

// Utilities
var _ = require("lodash");

var {
	ActivityIndicatorIOS,
	MapView,
 	Navigator,
	StyleSheet,
	Text,
	View,
} = React;

var styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loading: {
    flex: 1,
    alignSelf: 'center',
  },
	main: {
		flex: 1,
	},
	navBtn: {
		color: "#FFFFFF",
		marginHorizontal: 12,
		fontSize: 32,
		textAlign: "center"
	},
	navBarTitle: {
		color: "#FFFFFF",
		fontFamily: "System",
		fontSize: 22,
		justifyContent: "center",
		textAlign: "center"
	}
})

var MapScene = React.createClass({
	mixins: [TimerMixin, SiteMixin],
	_siteStreet: null,
	_timer: null,

	getInitialState: function() {
		return {
			siteStreet: null,
			mapParams: null,
			showMap: false,
		};
	},

	componentWillMount: function() {
		/************************************************
			Determine Map Details
		************************************************/
		let passedProps = this.props.route.passProps
			, geoPoints = new Array(passedProps.issue.geoPoint);
		
		this._siteStreet = this.buildPrimaryAddyLine(passedProps.site.address.street);

		MapActions.pullMapParams.triggerPromise(geoPoints, passedProps.dims).then((results) => {
			if ( !_.isEmpty(results) ) {
				_.assign(results, {
					"annotations": [{
						latitude: geoPoints[0].lat,
						longitude: geoPoints[0].long,
						title: passedProps.site.name,
						subtitle: this._siteStreet,
						hasLeftCallout: true,
		        onLeftCalloutPress: function() {
		        	console.log("map item pressed");
		        }
					}]
				});
			}

			return results;
		}).catch((err) => {
			console.log(err);
			return;
		}).finally((mapParams) => {
			this.setState({ mapParams: mapParams });
			
			// a temporary solution to resolve FPS issue w/ Map rendering (advised by Brent Vatne of Facebook)
			this._timer = this.setTimeout(() => {
	      this.setState({ showMap: true });
	    }, 300);
		});
	},

	componentWillUnmount: function() {
		this.clearTimeout(this._timer);
	},

	_renderScene: function(route, nav) {
		let navBar = null
			, passedProps = this.props.route.passProps
			, state = this.state;

		if (route.navigationBar) {
		 	navBar = React.cloneElement(route.navigationBar, {
		  	navigator: nav,
		  	route: route
		 	});
		}

		let mapStyle = StyleSheet.create({
			flex: 1,
			height: passedProps.dims.height,
			width: passedProps.dims.width
		});

		let Content = state.showMap ?
			<MapView
  			annotations={state.mapParams.annotations}
  			region={state.mapParams.region}
				style={mapStyle} /> :
			<ActivityIndicatorIOS
				animating={!state.showMap}
				style={styles.loading}
				size="large" />

		return (
			<View style={styles.container}>
				{navBar}
				{Content}	
			</View>
		);
	},

	render: function() {
		let state = this.state
			, props = this.props
			, passedProps = props.route.passProps;

		var backBtn =
			<NavBtn onPress={props.navigator.jumpBack}>
				<Icon name={"arrow-left-a"} style={styles.navBtn} />
			</NavBtn>;

		var navBarTitle =
			<View>
				<Text
					numberOfLines={1}
					style={styles.navBarTitle}>
					{this._siteStreet}
				</Text>
			</View>

		var navBar =
			<NavBar
				backgroundColor={passedProps.themeColor}
				customPrev={backBtn}
				customTitle={navBarTitle} />

		return (
			<Navigator
				renderScene={this._renderScene}
				initialRoute={{ navigationBar: navBar }} />
		);
	}
});

module.exports = MapScene;