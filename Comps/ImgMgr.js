var Display = require('react-native-device-display');
var Icon = require("react-native-vector-icons/Ionicons");
var React = require("react-native");

// Utilities
var Moment = require('moment');
var _ = require("lodash");

var {
	Image,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var ImgMgr = React.createClass({
	propTypes: {
		allowedToEdit: PropTypes.bool,
		imgHost: PropTypes.object,
		imgTypeId: PropTypes.number,
		openCameraMgr: PropTypes.func,
		prevImgUri: PropTypes.string,
  },
  _styles: StyleSheet.create({
  	camIcon: {
  		alignSelf: "center",
  	}
  }),

	render: function() {
		var btnStyle = {
			alignSelf: "center",
			margin: 10,
		};

		var imgStyle = {
			alignItems: "center",
			alignSelf: "center",
			height: Display.width * 10 / 16,
			justifyContent: "center",
			resizeMode: "cover",
			width: Display.width
		};

		var pixelsToFontRatio = 3 / 4;
		var iconToImgRatio = 0.5;
		var fontStyle = {
			borderWidth: 1,
			borderRadius: 0,
			borderColor: "#424242",
			color: "#424242",
			fontSize: Display.width * pixelsToFontRatio * iconToImgRatio,
			padding: 50,
		};

		fontStyle.borderRadius = (fontStyle.fontSize / pixelsToFontRatio + fontStyle.padding * 1.25) * 0.5;

		var Media = this.props.prevImgUri
			? <Image
					style={imgStyle}
					source={{uri: this.props.imgHost.url +this.props.prevImgUri +"?fit=crop&w=" +Display.width +"&h=" +Display.width * 9 / 16}} />
			: <View style={btnStyle}>
					<TouchableHighlight
						underlayColor="#A4A4A4"
						onPress={() => this.props.openCameraMgr(this.props.imgTypeId)}>
						<Icon
							name={"camera"}
							style={fontStyle} />
					</TouchableHighlight>
				</View>

		var EditLink = this.props.prevImgUri && this.props.allowedToEdit
			? <TouchableHighlight
					underlayColor="#A4A4A4"
					onPress={() => this.props.openCameraMgr(this.props.imgTypeId)}>
					<View>
						<Text style={{color: "#FF0000"}}>Edit</Text>
					</View>
				</TouchableHighlight>
			: null;

		return (
			<View>
				{Media}
				{EditLink}
			</View>
		);
	}
});

module.exports = ImgMgr;