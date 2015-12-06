'use strict';

// REACT PARTS
var React = require("react-native");

var {
	PropTypes,
	StyleSheet,
	Text,
	View,
} = React;

var LineSeparator = React.createClass({
  propTypes: {
		color: PropTypes.string,
		height: PropTypes.number,
		horzMargin: PropTypes.number,
		vertMargin: PropTypes.number,
  },

  getDefaultProps: function() {
  	return {
  		color: "#A4A4A4",
  		height: 0.75,
  		horzMargin: 4,
  		vertMargin: 4
  	}
  },

	render: function() {
		var style = StyleSheet.create({
			separator: {
			  backgroundColor: this.props.color,
			  height: this.props.height,
			  marginHorizontal: this.props.horzMargin,
			  marginVertical: this.props.vertMargin,
			},
		});
		
		return <View style={style.separator}></View>;
	},
});

module.exports = LineSeparator;