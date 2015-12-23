'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var React = require("react-native");
var Icon = require('react-native-vector-icons/Ionicons');

// COMPONENTS

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var ViewMixin = require("../Mixins/View");

// Utilities
var _ = require("lodash");

var {
  Image,
  Modal,
  PropTypes,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var ImgMgr = React.createClass({
  mixins: [IssueMixin, ViewMixin],
  propTypes: {
    img: PropTypes.object,
    lookups: PropTypes.object,
    openCam: PropTypes.func,
    setImg: PropTypes.func,
    style: PropTypes.number
  },
  _styles: StyleSheet.create({
    contentText: {
      color: "#848484",
      fontFamily: "System",
      fontSize: 22,
      fontWeight: "200",
      paddingHorizontal: 8,
      textAlign: "center"
    },
    media: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 2
    },
    img: {
      alignSelf: "center",
      borderWidth: 0.75,
      resizeMode: "cover"
    }
    // icon: {
    //   alignSelf: "center",
    //   color: "#848484",
    //   fontSize: 200,
    //   textAlign: "center"
    // }
  }),
  // _imgDims: null,
  _imgHost: "",
  _ImgView: null,

  getInitialState: function() {
    return { imgDims: null }
  },

  componentWillMount: function() {
    this._imgHost = this.props.lookups.hosts.img.provider.url;
  },

  componentWillUpdate: function(newProps, newState) {
    if ( !_.eq(newProps.img, this.props.img) || !_.eq(newState.imgDims, this.state.imgDims) )
      this._buildView(newProps.img, newState.imgDims);
  },

  _buildView: function(img, imgDims) {
    if ( _.isEmpty(img) ) {
      let iconStyle = {
        alignSelf: "center",
        color: this.Colors.night.border,
        fontSize: imgDims.width * 0.75,
        textAlign: "center"
      };

      this._View = <Icon name={"camera"} style={iconStyle} />;
    } else
      this._View = <Image style={[this._styles.img, imgDims]} source={{uri: this._imgHost +img.uri}} />;
  },

  // _setImg: function(stagedImg) {
  //   var images = _.cloneDeep(this.props.images);

  //   images[this.state.imgTypeId] = stagedImg;
  //   this.props.setImages(images, !_.some(images, _.isEmpty));
  //   this._toggleCamMgr(false);
  // },

  _setImgDims: function(e) {
    if ( _.isEmpty(this.state.imgDims) ) {
      var layout = e.nativeEvent.layout; 
      
      this.setState({
        imgDims: {
          height: layout.width / this.AspectRatios["4x3"],
          width: layout.width
        }
      });
    }
  },

  // _toggleCamMgr: function(state) {
  //   this.setState({ camMgrOn: state });
  // },

  // _trashImg: function() {
  //   var images = _.cloneDeep(this.props.images);

  //   images[this.state.imgTypeId] = null;
  //   this.props.setImages(images, this.isDone(images));
  //   return new Promise.resolve();
  // },

  render: function() {
    return (
      <TouchableHighlight
        onLayout={this._setImgDims}
        onPress={this.props.openCam}
        underlayColor={this.Colors.night.border}
        style={[this.props.style, this._styles.media]}>
        <View>{this._View}</View>
      </TouchableHighlight>
    );
  }
});

module.exports = ImgMgr;