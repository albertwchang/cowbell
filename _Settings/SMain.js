'use strict';

// REACT PARTS
var Display = require("react-native-device-display");
var FileSystem = require('react-native-fs');
var React = require("react-native");
var Reflux = require("reflux");

// ACTIONS && STORES

// MIXINS
var ViewMixin = require("../Mixins/View");

// UTILITIES
var _ = require("lodash");

var {
	PropTypes,
	ScrollView,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var SMain = React.createClass({
	propTypes: {
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		lookups: PropTypes.object,
		themeColors: PropTypes.array
	},
	_styles: StyleSheet.create({
		main: {
			height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			position: "absolute",
			top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			width: Display.width
		},
		showBtn: {
			alignItems: "center",
			borderColor: "#A4A4A4",
			borderRadius: 4,
			borderWidth: 0.5,
			flex: 1,
			margin: 6,
			padding: 6
		},
		fileBox: {
			borderColor: "#A4A4A4",
			borderBottomWidth: 0.5,
			flex: 1,
			padding: 6
		}, fileText: {
				fontFamily: "System",
				fontSize: 16,
				fontWeight: "200",
				textAlign: "left"
			}
	}),
	_sources: ["MainBundle", "DocumentDirectory", "CachesDirectory"],

	getInitialState: function() {
		return {
			files: {},
			sources: null
		}
	},

	componentWillMount: function() {
		_.each(this._sources, (source) => {
			this.state.files[source] = null;
		});

		this.setState(this.state);
	},

	_showFiles: function() {
		this.state.sources = this._sources;

		_.each(this.state.sources, (source) => {
			FileSystem.readDir('/', FileSystem[source]).then((result) => {
		    console.log(source, result);

		    this.state.files[source] = _.remove(result, (file) => {
	    		return _.endsWith(file.path, ".jpg");
	    	});
		    
		    this.setState(this.state);
		    // access meta data of each object to get filepath
		   //  _.each(result, (obj, key) => {
		   //  	FileSystem.unlink(obj.path).spread((success, path) => {
					// 	console.log('FILE DELETED', success, path);
					// }).catch((err) => {
				 //    console.log(err.message);
				 //  });
		   //  });
		  })
		  .catch((err) => {
		    console.log(err.message, err.code);
		  });
		});
	},

	render: function() {
		return (
			<View style={this._styles.main}>
				<TouchableHighlight
					onPress={this._showFiles}>
					<View style={ [this._styles.showBtn, {backgroundColor: this.props.themeColors[this.props.currentSiteRight.orgTypeId]}] }>
						<Text style={{fontSize: 22, textAlign: "center"}}>Show Files</Text>
					</View>
				</TouchableHighlight>
				<ScrollView contentInset={{top: -25}} scrollEventThrottle={200}>{
	        _.map(this._sources, (sourceName) => (
	        	<View style={this._styles.fileBox}>
							<Text style={{color: this.props.themeColors[this.props.currentSiteRight.orgTypeId], fontSize: 28}}>
								{sourceName}
							</Text>{
							_.map(this.state.files[sourceName], (file) => (
								<Text style={ [this._styles.fileText, {color: this.props.themeColors[this.props.currentSiteRight.orgTypeId]}] }>
									{file.path}
								</Text>
	        		))
	        	}
						</View>	
	        ))
	      }
				</ScrollView>
			</View>
		);
	}
});

module.exports = SMain;