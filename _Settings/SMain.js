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
		    let state = _.cloneDeep(this.state);
				
				state.files[source] = _.remove(result, (file) => {
	    		return _.endsWith(file.path, ".jpg");
	    	});
		    
		    this.setState(state);
		  })
		  .catch((err) => {
		    console.log(err.message, err.code);
		  });
		});
	},

	render: function() {
		let themeColor = this.props.themeColor;

		return (
			<View style={this._styles.main}>
				<TouchableHighlight
					onPress={this._showFiles}>
					<View style={ [this._styles.showBtn, {backgroundColor: themeColor}] }>
						<Text style={{fontSize: 22, textAlign: "center"}}>Show Files</Text>
					</View>
				</TouchableHighlight>
				<ScrollView contentInset={{top: -25}} scrollEventThrottle={200}>{
	        this._sources.map((sourceName) => (
	        	<View key={sourceName} style={this._styles.fileBox}>
							<Text style={{color: themeColor, fontSize: 28}}>{sourceName}</Text>
							{this.state.files[sourceName].map((file) => (
								<Text
									key={file.path}
									style={ [this._styles.fileText, {color: themeColors}] }>{file.path}
								</Text>
	        		))}
						</View>	
	        ))
	      }
				</ScrollView>
			</View>
		);
	}
});

module.exports = SMain;