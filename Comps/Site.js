var React = require("react-native");
var Comm = require('react-native-communications');
var Icon = require('react-native-vector-icons/Ionicons');

// MIXINS
var SiteMixin = require("../Mixins/Site");
var _ = require("lodash");

var {
	Image,
	PixelRatio,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	img: {
		flex: 1,
		borderWidth: 1,
		resizeMode: "contain"
	},
	infoSection: {
		flex: 4,
		flexDirection: "column",
		paddingHorizontal: 6,
	}, name: {
			color: "#FFFFFF",
			flex: 1,
			fontFamily: "System",
			fontSize: 18,
		},
		addy: {
			color: "#FFFFFF",
			flex: 1,
			fontFamily: "helvetica neue",
			fontSize: 16,
			fontWeight: "200",
		},
	callBtn: {
		alignSelf: "center",
		alignItems: "center",
		borderRadius: 6,
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 2
	}, callBtnIcon: {
			color: "#FFFFFF",
			fontSize: 52,
			justifyContent: "center",
			textAlign: "center"
		}
});

var Site = React.createClass({
	mixins: [SiteMixin],
	propTypes: {
		imgHost: PropTypes.string,
		info: PropTypes.object,
		showImg: PropTypes.bool,
		showPhoneBtn: PropTypes.bool,
		showAddy: PropTypes.object,
		themeColor: PropTypes.string
	},

	getDefaultProps: function() {
		return {
			isBtn: false,
			showImg: true,
			showAddy: { street: true, city: true, state: true, zip: true }
		}
	},

	render: function() {
		let { info, imgHost, showAddy, showPhoneBtn, showImg, style, themeColor } = this.props
			, address = info.address
			, imgUri = imgHost +info.img.icon +"?w=49";

		let Img = showImg ? <Image style={styles.img} source={{ uri: imgUri }} /> : null;
		let PhoneBtn = showPhoneBtn ?
			<TouchableHighlight
				onPress={() => Comm.phonecall(info.phoneNum.toString(), true)}
				style={ [styles.callBtn, { backgroundColor: themeColor, borderRadius: 6 } ] }>
				<View style={styles.callBtn}>
					<Icon name={"ios-telephone"} style={ [styles.callBtnIcon] } />
				</View>
			</TouchableHighlight> : null;
		
		return (
			<View style={style}>
				{Img}
				<View style={styles.infoSection}>
					<Text numberOfLines={1} style={styles.name}>{info.name}</Text>
					<Text numberOfLines={1} style={styles.addy}>
						{ showAddy.street ? this.buildPrimaryAddyLine(address.street) : null }
					</Text>
					{_.any(showAddy, (param) => param) ?
					<Text  numberOfLines={1} style={styles.addy}>
						{this.buildSecondaryAddyLine(address)}
					</Text> : null}
				</View>
				{PhoneBtn}
			</View>
		);
	}
});

module.exports = Site;