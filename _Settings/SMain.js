'use strict';

// REACT PARTS
var Defer = require("promise-defer");
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
	mixins: [ViewMixin],
	propTypes: {
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		lookups: PropTypes.object,
		themeColor: PropTypes.string
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
		return { files: {} }
	},

	_clearFiles: function() {
		this.setState({files: {}})
	},

	_showFiles: function() {
		let state = _.cloneDeep(this.state);
		let promises = _.map(this._sources, (source, index) => {
			return FileSystem.readDir('/', FileSystem[source]).then((result) => {
		    console.log(source, result);    
		    state.files[source] = _.remove(result, (file) => {
	    		return _.endsWith(file.path, ".jpg") || _.endsWith(file.path, ".png");
	    	});
		  })
		  .catch((err) => {
		    console.log(err.message, err.code);
		  })
		  .finally(() => {
		  	return;
		  });
		});

		new Promise.all(promises).then((results) => {
			this.setState(state);
		});
	},

	render: function() {
		let themeColor = this.props.themeColor;

		return (
			<View style={this._styles.main}>
				<View style={{ flexDirection: "row" }}>
					<TouchableHighlight onPress={this._showFiles}>
						<View style={ [this._styles.showBtn, {backgroundColor: themeColor}] }>
							<Text style={{fontSize: 22, textAlign: "center"}}>Show Files</Text>
						</View>
					</TouchableHighlight>
					<TouchableHighlight onPress={this._clearFiles}>
						<View style={ [this._styles.showBtn, {backgroundColor: this.Colors.night.border}] }>
							<Text style={{fontSize: 22, textAlign: "center"}}>Clear</Text>
						</View>
					</TouchableHighlight>
				</View>
				<ScrollView contentInset={{top: -25}} scrollEventThrottle={200}>{
	        _.map(this._sources, (sourceName) => {
	        	let files = this.state.files[sourceName];
	        	
	        	return (
	        		<View key={sourceName} style={this._styles.fileBox}>
								<Text style={{color: themeColor, fontSize: 28}}>{sourceName}</Text>
								{
									_.map(files, (file) => {
										return (
											<Text
												key={file.path}
												style={ [this._styles.fileText, {color: themeColor}] }>{file.path}
											</Text>
										)
			        		})
								}
							</View>
						)
	        })
	      }
				</ScrollView>
			</View>
		);
	}
});

module.exports = SMain;