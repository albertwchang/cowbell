'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var React = require("react-native");
// var Signature = require('react-native-signature-capture');

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");

// MIXINS
var ViewMixin = require("../Mixins/View");

// Utilities
var _ = require("lodash");

var {
	Image,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var Signature = React.createClass({
	propTypes: {
		approval: PropTypes.object,
		imgHost: PropTypes.object,
		needsApproval: PropTypes.bool,
		readOnly: PropTypes.bool,
		setApprovalProperty: PropTypes.func,
		themeColors: PropTypes.array
	},
	mixins: [ViewMixin],
	_styles: StyleSheet.create({
		section: {
			backgroundColor: "#FF0000",
			flexDirection: "row",
			justifyContent: "flex-end"
		}, signature: {
				backgroundColor: "#FF0000",
				borderColor: "#FFFFFF",
				borderBottomWidth: 1,
				flex: 1,
				height: Display.width / ViewMixin.AspectRatios["21x9"],
				justifyContent: "flex-end",
				paddingHorizontal: 10
			}, signatureText: {
					color: "#FFFFFF",
					fontFamily: "System",
					fontSize: 22,
					fontWeight: "200"
				},
			closeSignatureBtn: {
				position: "absolute",
				bottom: 0
			}
	}),

	render: function() {
		// being in finalize scene assumes that there is a nextStatus option
		var approval = this.props.approval;
		var themeColors = this.props.themeColors;
		var Signature;

		if (!this.props.needsApproval || !approval)
			return null;

		if (approval.signatureUri)
			Signature =
				<Image
					source={{ uri: this.props.imgHost.url +approval.signatureUri}}
					style={ [this._styles.signature, {resizeMode: "cover"}] } />
		else
			Signature = 
				<View style={this._styles.signature}>
					<Text style={this._styles.signatureText}>X</Text>
				</View>

		if (this.props.readOnly)
			return (<View style={this._styles.section}>{Signature}</View>)
		else	
			return (
				<TouchableHighlight
					onPress={() => this.props.setApprovalProperty({signatureUri: "/issues/signature/issue1-krafferty.jpg"}, "fresh")}>
					{Signature}
				</TouchableHighlight>	
			);
	}
});

module.exports = Signature;