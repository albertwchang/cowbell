var React = require("react-native");
var Icon = require('react-native-vector-icons/Ionicons');

// Utilities
// var _ = require("lodash");

var {
	PropTypes,
	StyleSheet,
	Text,
	View,
} = React;

var _styles = StyleSheet.create({
	unit: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "center",
		marginBottom: 4,
		paddingVertical: 2
	},
	iconBox: {
		flex: 1,
		justifyContent: "center"
	}, icon: {
		alignSelf: "center",
		color: "#DF7401",
		fontSize: 20
	},
	textBox: {
		flex: 2
	}, text: {
		textAlign: "left",
		color: "#DF7401",
		fontFamily: "System",
		fontSize: 16,
		fontWeight: "200"
	}
});

var Eta = React.createClass({
	propTypes: {
		style: PropTypes.number
	},

	render: function() {
		return (
			<View style={this.props.style}>
				<View style={_styles.unit}>
					<View style={_styles.iconBox}>
						<Icon name="ios-location" style={_styles.icon} />
					</View>
					<View style={_styles.textBox}>
						<Text style={_styles.text}>9.9mi</Text>
					</View>
				</View>
				<View style={_styles.unit}>
					<View style={_styles.iconBox}>
						<Icon name="ios-clock" style={_styles.icon} />
					</View>
					<View style={_styles.textBox}>
						<Text style={_styles.text}>21min</Text>
					</View>
				</View>
			</View>
		);
	}
});

module.exports = Eta;