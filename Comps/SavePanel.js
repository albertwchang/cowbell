var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var Orientation = require('react-native-orientation');
var React = require("react-native");

// MIXINS
var ViewMixin = require("../Mixins/View");

// Utilities
var Moment = require('moment');
var _ = require("lodash");

var {
	AlertIOS,
	Dimensions,
	Image,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var SavePanel = React.createClass({
	mixins: [ViewMixin],
	propTypes: {
		dims: PropTypes.object,
		orientation: PropTypes.string,
		setItem: PropTypes.func,
		trashItem: PropTypes.func
  },
  _buttons: null,

	getDefaultProps: function() {
		return {
			dims: {
				height: ViewMixin.Dimensions.ACTION_BTN_HEIGHT,
				width: Display.width
			},
			orientation: ViewMixin.Orientations.PORTRAIT
		}
	},

	componentWillMount: function() {
		this._buttons = [
	  	{
	  		style: this.Styles._textStyle.liked,
	  		iconName: "ios-checkmark-outline",
	  		onPress: this.props.setItem
	  	}, {
	  		style: this.Styles._textStyle.hated,
	  		iconName: "ios-trash-outline",
	  		onPress: this.props.trashItem
	  	}
	  ];
	},

	render: function() {
		var borderWidth = 1;
		var dims = this.props.dims;
		var orientation = this.props.orientation;
		var padding = 2;
		
		var styles = {
			btn: {
				flex: 1,
			},
			btnIcon: {
				alignSelf: "center",
				color: "#A4A4A4",
				fontSize: 0
			},
			controlPanel: {
				alignItems: "center",
				backgroundColor: "#2E2E2E",
			  borderColor: '#A4A4A4',
				height: dims.height,
				position: "absolute",
				width: dims.width
			}
		};

		if (orientation === this.Orientations.PORTRAIT) {
			styles.btnIcon.fontSize = dims.height - 2*padding - borderWidth;
			_.assign(styles.controlPanel, {
				bottom: 0,
				borderTopWidth: borderWidth,
				flexDirection: "row",
				paddingVertical: padding
			});
		} else {
			styles.btnIcon.fontSize = dims.width - 2*padding - borderWidth;
			_.assign(styles.controlPanel, {
				borderRightWidth: borderWidth,
				flexDirection: "column",
				left: 0,
				paddingHorizontal: padding
			});
		}
		
		return (
			<View style={[ styles.controlPanel ]}>
				<View style={styles.btn}></View>
				{
				this._buttons.map((btn) => (
      		<TouchableHighlight
      			key={btn.iconName}
						onPress={btn.onPress}
						style={styles.btn}>
						<Icon
							name={btn.iconName}
							style={ [styles.btnIcon, btn.style] } />
					</TouchableHighlight>
      	))}
				<View style={styles.btn}></View>
			</View>
		);
	}
})

module.exports = SavePanel;