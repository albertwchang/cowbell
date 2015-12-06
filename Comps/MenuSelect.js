'use strict';

// REACT PARTS
var Display = require("react-native-device-display");
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");

// COMPONENTS
var LineSeparator = require("./LineSeparator");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var ViewMixin = require("../Mixins/View");

// UTILITIES
var _ = require("lodash");

var {
	Image,
	ListView,
 	PropTypes,
	StyleSheet,
	TouchableHighlight,
	Text,
	View
} = React;

var MenuSelect = React.createClass({
	mixins: [IssueMixin, ViewMixin],
	propTypes: {
		choice: PropTypes.string,
		ds: PropTypes.object,
		menuTitle: PropTypes.string,
		options: PropTypes.array,
		renderRow: PropTypes.func,
		setValue: PropTypes.func,
		style: PropTypes.number,
		themeColor: PropTypes.string
	},

	_styles: StyleSheet.create({
		main: {
			height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			justifyContent: "center",
			width: Display.width
		},
		menuTitle: {
			fontFamily: "System",
			fontSize: 36,
			fontWeight: "200",
			textAlign: "center"
		},
		optionButtons: {
			flex: 1,
			flexDirection: "column"
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
		}
	}),

	getDefaultProps: function() {
		return {
			renderRow: function() {
				return undefined;
			}
		}
	},

	_renderRow: function(option, sectionId, rowId, onIcon, offIcon) {
		var Content = (typeof option === "object") ?
			<View key={rowId} style={this._styles.optionBtn}>
  			{this.props.choice === option.iid ? onIcon : offIcon}
      	<View style={this._styles.stBox}>
      		<Text style={this._styles.optionText}>{option.name}</Text>
      	</View>
  		</View>
  	: <View key={rowId} style={this._styles.optionBtn}>
  			{this.props.choice === option ? onIcon : offIcon}
      	<View style={this._styles.stBox}>
      		<Text style={this._styles.optionText}>{option}</Text>
      	</View>
  		</View>

		return (
			<TouchableHighlight
				key={option.iid}
  			onPress={() => this.props.setValue(option.iid || option)}>{Content}
  		</TouchableHighlight>	
		);
	},

	_renderSeparator: function(sectionId, rowId) {
		if (parseInt(rowId) === this.props.options.length - 1)
			return null;
		
		return null;
		// return (<LineSeparator height={0.5} vertMargin={0} color={this.props.themeColor} />);
	},

	render: function() {
		var onIcon = <Icon name={"ios-checkmark"} style={[this._styles.optionIcon, this.Styles._textStyle.on]} />
		var offIcon = <Icon name={"ios-circle-outline"} style={[this._styles.optionIcon, this.Styles._textStyle.off]} />
		var dimensions = this.Dimensions;

		if (this.props.ds && !_.isEmpty(this.props.options)) {
			var Header = this.props.menuTitle ?
				<View>
					<Text style={ [this._styles.menuTitle, {color: this.props.themeColor}] }>{this.props.menuTitle}</Text>
					<LineSeparator height={0.5} vertMargin={0} color={this.props.themeColor} />			
				</View>
				: null;

			return (
	    	<View style={ [this._styles.optionButtons, this.props.style || this._styles.main] }>
	    		{Header}
	    		<ListView
		        dataSource={this.props.ds.cloneWithRows(this.props.options)}
		        removeClippedSubviews={true}
		        renderRow={(x, y, z) => this.props.renderRow(x, y, z, onIcon, offIcon) || this._renderRow(x, y, z, onIcon, offIcon)}
						renderSeparator={this._renderSeparator} />
	    	</View>
			);
		} else
			return (
				<View style={this.props.style || this._styles.main}>{
					_.map(this.props.options, (option) => (
						this.props.renderRow(option)
					))
				}
				</View>
			);
	}
});

module.exports = MenuSelect;