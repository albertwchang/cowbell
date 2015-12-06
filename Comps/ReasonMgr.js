'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");

// CUSTOM COMPONENTS
var CodeScene = require("../Comps/CodeScene");
var MenuSelect = require("../Comps/MenuSelect");

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var _ = require("lodash");

var {
	ListView,
	Modal,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var ReasonMgr = React.createClass({
	mixins: [SiteMixin, ViewMixin],
	propTypes: {
		nav: PropTypes.object,
		reason: PropTypes.object,
		reasons: PropTypes.array,
		resetData: PropTypes.func,
		setTopicData: PropTypes.func,
		style: PropTypes.number,
		themeColor: PropTypes.string
  },

	_styles: StyleSheet.create({
		menu: {
			backgroundColor: "#000000",
			height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			paddingHorizontal: 4,
			position: "absolute",
			top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			width: Display.width
		},
		reasonItem: {
			backgroundColor: "#2E2E2E",
			borderColor: "#848484",
			borderRadius: 4,
			borderWidth: 0.75,
      flexDirection: "row",
      paddingHorizontal: 4,
      paddingVertical: 6,
      marginVertical: 4
    }, reasonIcon: {
        flex: 1,
        fontSize: 32,
        fontWeight: "100",
        textAlign: "center"
      },
      reasonText: {
        fontFamily: "System",
        fontSize: 22,
        fontWeight: "200",
        textAlign: "left"
      },
      reasonInfo: {
        fontSize: 32,
        fontWeight: "100",
        textAlign: "center"
      }
	}),

	getInitialState: function() {
		return {
			infoOn: false,
			menuOn: false,
			chosenReason: this.props.reason,
			reasonForInfo: null,
			ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid})
		};
	},

	componentWillReceiveProps: function(newProps) {
		this.setState({
			chosenReason: newProps.reason
		});
	},

	_toggleInfo: function(reason) {
		this.setState({
			reasonForInfo: reason
		})
	},

	_setReason: function(reason) {
		this.props.setTopicData("reason", reason, true);
		this.setState({
			chosenReason: reason,
			menuOn: false
		});
	},

	_renderReason: function(reason) {
		if (this.state.chosenReason && reason.iid === this.state.chosenReason.iid)
			return (
				<View style={ [this._styles.reasonItem, this.Styles._viewStyle.on] }>
	        <TouchableHighlight
		        onPress={() => this._setReason(reason)}
		        style={{flex: 9}}>
		        <View style={{flexDirection: "row"}}>
			        <Icon
				        name={"ios-checkmark"}
				        style={[this._styles.reasonIcon, this.Styles._textStyle.on]} />
		          <View style={{flex: 5, justifyContent: "center"}}>
			          <Text
			            numberOfLines={1}
			            style={ [this._styles.reasonText, this.Styles._textStyle.on] }>{reason.name}
			          </Text>
			      	</View>
						</View>
					</TouchableHighlight>
					<TouchableHighlight
		        onPress={() => this._toggleInfo(reason)}
		        style={{flex: 1}}>
		        <Icon
		          name={"ios-information-outline"}
		          style={[this._styles.reasonInfo, this.Styles._textStyle.on]} />
		    	</TouchableHighlight>
	      </View>
	    );
		else
			return (
	      <View style={ [this._styles.reasonItem, this.Styles._viewStyle.off] }>
	        <TouchableHighlight
		        onPress={() => this._setReason(reason)}
		        style={{flex: 9}}>
		        <View style={{flexDirection: "row"}}>
			        <Icon
				        name={"ios-circle-outline"}
				        style={[this._styles.reasonIcon, this.Styles._textStyle.off]} />
		          <View style={{flex: 5, justifyContent: "center"}}>
			          <Text
			            numberOfLines={1}
			            style={ [this._styles.reasonText, this.Styles._textStyle.off] }>{reason.name}
			          </Text>
			      	</View>
						</View>
					</TouchableHighlight>
					<TouchableHighlight
		        onPress={() => this._toggleInfo(reason)}
		        style={{flex: 1}}>
		        <Icon
		          name={"ios-information-outline"}
		          style={[this._styles.reasonInfo, this.Styles._textStyle.off]} />
		    	</TouchableHighlight>
	      </View>
	    );
  },

	render: function() {
		if (this.state.menuOn) {
			var Content = this.state.reasonForInfo ?
				<CodeScene
			    reason={this.state.reasonForInfo}
			    style={this._styles.menu}
			    themeColor={this.props.themeColor}
			    closeInfo={() => this._toggleInfo(null)} /> :
				<MenuSelect
	        ds={this.state.ds}
	        menuTitle="Reasons"
	        options={this.props.reasons}
	        renderRow={this._renderReason}
	        style={this._styles.menu}
	        themeColor={this.props.themeColor} />

			return (<Modal animation={false} visible={this.state.menuOn}>{Content}</Modal>);
		}
		else {
			var Content = this.state.chosenReason ? 
				<Text style={ [this._styles.reasonText, this.Styles._textStyle.on] }>{this.state.chosenReason.name}</Text> :
				<Text style={ [this._styles.reasonText, this.Styles._textStyle.off] }>--- Nothing yet chosen ---</Text>

			return (
				<TouchableHighlight
          onPress={ () => this.setState({menuOn: true}) }
          style={{backgroundColor: "#2E2E2E"}}>
          <View style={this.props.style}>{Content}</View>
        </TouchableHighlight>
			);
		}
	}
});

module.exports = ReasonMgr;