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
  _View: null,

  getInitialState: function() {
    return { imgDims: null };
  },

  componentWillUpdate: function(newProps, newState) {
    if ( !_.eq(newProps.img, this.props.img) || !_.eq(newState.imgDims, this.state.imgDims) || _.isEmpty(this._View) )
      this._buildView(newProps.img, newState.imgDims);
  },

  componentWillUnmount: function() {
    this._View = null;
  },

  _buildView: function(img, imgDims) {
    this._View = null;

    if ( _.isEmpty(img) || _.isUndefined(img)) {
      let iconStyle = {
        alignSelf: "center",
        color: this.Colors.night.border,
        fontSize: imgDims.width * 0.75,
        textAlign: "center"
      };

      this._View = <Icon name={"camera"} style={iconStyle} />;
    } else {
      let imgUri = img.file.uri
        , imgHost = this.props.lookups.hosts.img.provider.url;
      
      this._View = <Image style={[this._styles.img, imgDims]} source={{uri: imgUri}} />;
    }
  },

  _setImgDims: function(e) {
    if ( _.isEmpty(this.state.imgDims) ) {
      let width = e.nativeEvent.layout.width; 
      
      this.setState({
        imgDims: { height: width / this.AspectRatios["4x3"], width: width }
      });
    }
  },

  render: function() {
    let { style, openCam } = this.props;

    return (
      <TouchableHighlight
        style={[style, this._styles.media]}
        underlayColor={this.Colors.night.border}
        onLayout={this._setImgDims} onPress={openCam}>
        <View>{this._View}</View>
      </TouchableHighlight>
    );
  }
});

module.exports = ImgMgr;