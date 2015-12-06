var React = require("react-native");
var Icon = require("react-native-vector-icons/Ionicons");

var {
	Image,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	mainBox: {
		backgroundColor: "#2E2E2E",
		borderColor: "#FFFFFF",
		borderBottomWidth: 0.75,
		flexDirection: "row",
		height: 45,
		padding: 4
	}, userImg: {
		borderRadius: 2,
		flex: 1,
		resizeMode: "contain",
	}, userName: {
		alignItems: "center",
		flex: 7,
		fontFamily: "System",
		fontSize: 26,
		fontWeight: "200",
		justifyContent: "center",
		paddingHorizontal: 4,
		textAlign: "center"
	}, employerImg: {
		borderRadius: 2,
		flex: 1,
		resizeMode: "contain",
	}
});

var User = React.createClass({
	propTypes: {
		employerSite: PropTypes.object,
		imgHost: PropTypes.object,
		info: PropTypes.object,
		setValue: PropTypes.func,
		themeColor: PropTypes.string
	},

	render: function() {
		var info = this.props.info;
		var uriParams = "?fit=crop&w=45&h=45";
		var imgHostUrl = this.props.imgHost.url;
		var userImgUri = imgHostUrl +info.uri.selfie +uriParams;
		var employerImgUri = imgHostUrl +this.props.employerSite.uri +uriParams;
		var Content = 
			<View style={styles.mainBox}>
				<Image
					source={{ uri: userImgUri }}
					style={styles.userImg} />
				<Text
					numberOfLines={1}
					style={ [styles.userName, {color: this.props.themeColor}] }>{info.name.first +" " +info.name.last}</Text>
				<Image
					source={{ uri: employerImgUri }}
					style={styles.employerImg} />
			</View>

		if (!this.props.setValue)
			return (Content);
		else
			return (
				<TouchableHighlight
					key={info.iid}
	  			onPress={() => this.props.setValue(info.iid)}>{Content}
				</TouchableHighlight>
			);
	}
});

module.exports = User;