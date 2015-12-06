var React = require("react-native");

var {
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View
} = React;

var _styles = StyleSheet.create({
	btn: {
		borderColor: "#FFFFFF",
		borderRadius: 2,
		borderWidth: 0.5,
		flex: 1,
		padding: 6
	}, btnCancel: {
			backgroundColor: "#FF0000"
		},
		btnSave: {
			backgroundColor: "#00FF40",
		}, text: {
			color: "#A4A4A4",
			fontFamily: "System",
			fontSize: 30,
			textAlign: "center"
		}, textCancel: {
			color: "#FFFFFF"
		}, textSave: {
			color: "#000000"
		}
});

var ActionButtons = React.createClass({
	propTypes: {
		cancel: PropTypes.func,
		inputChanged: PropTypes.bool,
		saveData: PropTypes.func,
		showDoneBtn: PropTypes.bool,
		style: PropTypes.number,
		themeColor: PropTypes.string
	},

	getDefaultProps: function() {
		return {
			inputChanged: false,
			showDoneBtn: false
		}
	},

	render: function() {
		var DoneBtn = this.props.showDoneBtn ?
			<TouchableHighlight
				onPress={this.props.cancel}>
				<View style={[_styles.btn, this.props.style, {backgroundColor: this.props.themeColor}]}>
					<Text style={ [_styles.text, _styles.textCancel] }>Done</Text>
				</View>
			</TouchableHighlight>
		 : null;

		if (this.props.inputChanged)
			return (
				<View style={this.props.style}>
					<TouchableHighlight
						onPress={this.props.cancel}
						style={ [_styles.btn, _styles.btnCancel] }>
						<Text style={ [_styles.text, _styles.textCancel] }>Cancel</Text>
					</TouchableHighlight>
					<TouchableHighlight
						onPress={this.props.saveData}
						style={ [_styles.btn, _styles.btnSave] }>
						<Text style={ [_styles.text, _styles.textSave] }>Save</Text>
					</TouchableHighlight>
				</View>
			);
		else
			return (DoneBtn);
	}
});

module.exports = ActionButtons;