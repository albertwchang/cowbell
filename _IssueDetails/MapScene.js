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
	getInitialState: function() {
		return {
			clientStreet: null,
			mapParams: null,
			showMap: false,
		};
	},

	componentWillMount: function() {
		/************************************************
			Determine Map Details
		************************************************/
		var props = this.props.route.passProps;
		var clientStreet = props.sites.client.address.street;
		var geoPoints = new Array(props.issue.geoPoint);

		this.setState({
			clientStreet: clientStreet.number +" " +clientStreet.name +" " +clientStreet.type +" " +clientStreet.unit
		});

		MapActions.pullMapParams.triggerPromise(geoPoints, props.dims).then((results) => {
			if (results != undefined) {
				_.extend(results, {
					"annotations": [{
						latitude: props.issue.geoPoint.lat,
						longitude: props.issue.geoPoint.long,
						title: props.sites.client.name,
						subtitle: clientStreet.number +" " +clientStreet.name +" " +clientStreet.type +" " +clientStreet.unit,
						hasLeftCallout: true,
		        onLeftCalloutPress: function() {
		        	console.log("map item pressed");
		        }
					}]
				});
			
				this.setState({
					mapParams: results
				});
			}
		});
	},

	componentDidMount: function() {
		this.setTimeout(() => {
      this.setState({
      	showMap: true,
      });
    }, 400);
	},

	_renderScene: function(route, nav) {
		var navBar = null;

		if (route.navigationBar) {
		 	navBar = React.addons.cloneWithProps(route.navigationBar, {
		  	navigator: nav,
		  	route: route
		 	});
		}

		var mapStyle = {
			flex: 1,
			height: this.props.route.passProps.dims.height,
			width: this.props.route.passProps.dims.width,
		};

		if (this.state.showMap)
			return (
				<View style={styles.container}>
					{navBar}
					<MapView
		  			annotations={this.state.mapParams.annotations}
		  			region={this.state.mapParams.region}
						style={mapStyle} />
				</View>
			);
		else
			return (
				<View style={styles.container}>
					{navBar}
					<ActivityIndicatorIOS
						animating={true}
						style={styles.loading}
						size="large" />
				</View>
			);
	},

	render: function() {
		var props = this.props.route.passProps;

		var backBtn =
			<NavBtn onPress={this.props.navigator.jumpBack}>
				<Icon name={"arrow-left-a"} style={styles.navBtn} />
			</NavBtn>;

		var navBarTitle =
			<View>
				<Text
					numberOfLines={1}
					style={styles.navBarTitle}>
					{this.state.clientStreet}
				</Text>
			</View>

		var navBar =
			<NavBar
				backgroundColor={props.themeColors[props.currentSiteRight.orgTypeId]}
				customPrev={backBtn}
				customTitle={navBarTitle} />

		return (
			<Navigator
				renderScene={this._renderScene}
				initialRoute={{
				  navigationBar: navBar,
				}} />
		);
	}
});

module.exports = MapScene;