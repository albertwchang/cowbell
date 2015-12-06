var React = require("react-native");

// Utilities
// var _ = require("lodash");

var {
	SegmentedControlIOS
} = React;

module.exports = React.createClass({
	render: function() {
		var navBarStyle = {
			alignItems: "center",
			alignSelf: "center",
			justifyContent: "center",
			width: this.props.width * 6/10,
		};

		return (
			<SegmentedControlIOS
				enabled={true}
				onChange={this.props.changeScene}
				selectedIndex={this.props.sceneIndex}
				style={navBarStyle}
				tintColor={this.props.color}
				values={this.props.links} />
		)
	}
});