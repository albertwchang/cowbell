var React = require("react-native");
var Comm = require('react-native-communications');
var Icon = require('react-native-vector-icons/Ionicons');

// Utilities
// var _ = require("lodash");

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
	propTypes: {
		imgHost: PropTypes.object,
		info: PropTypes.object,
		showImg: PropTypes.bool,
		showPhoneBtn: PropTypes.bool,
		showAddy: PropTypes.object,
		style: PropTypes.number,
		themeColors: PropTypes.array
	},

	getDefaultProps: function() {
		return {
			isBtn: false,
			showImg: true,
			showAddy: {
				street: true,
				city: true,
				state: true,
				zip: true
			}
		}
	},

	render: function() {
		let info = this.props.info
			, address = info.address
			, imgUri = this.props.imgHost.url +info.uri +"?w=49"
			, showAddy = this.props.showAddy
			, themeColors = this.props.themeColors;

		let Img = this.props.showImg ?
			<Image
				defaultSource={require('image!client')}
				style={styles.img}
				source={{ uri: imgUri }} />
			: null;

		let PhoneBtn = this.props.showPhoneBtn ?
			<TouchableHighlight
				onPress={() => Comm.phonecall(info.phoneNum.toString(), true)}
				style={ [styles.callBtn, {backgroundColor: themeColors[info.orgTypeId], borderRadius: 6}] }>
				<View style={styles.callBtn}>
					<Icon
						name={"ios-telephone"}
						style={ [styles.callBtnIcon] } />
				</View>
			</TouchableHighlight> : null;
		
		return (
			<View style={this.props.style}>
				{Img}
				<View style={styles.infoSection}>
					<Text
						numberOfLines={1}
						style={styles.name}>{info.name}</Text>
					<Text
						numberOfLines={1}
						style={styles.addy}>
						{ showAddy.street ?
							address.street.number +" "
							+address.street.name +" "
							+address.street.type +" "
							+address.street.unit : null}
					</Text>
					{showAddy.city || showAddy.state || showAddy.zip
						? <Text 
								numberOfLines={1}
								style={styles.addy}>
								{ showAddy.city ? address.city +", " : null }
								{ showAddy.state +" " ? address.state : null }
								{ showAddy.zip ? address.zip.primary : null }
							</Text>
						: null}
				</View>
				{PhoneBtn}
			</View>
		);
	}
});

module.exports = Site;