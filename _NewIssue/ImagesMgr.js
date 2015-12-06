'use strict';

// REACT PARTS
var React = require("react-native");
var Icon = require('react-native-vector-icons/Ionicons');

// COMPONENTS
var CamMgr = require("../Comps/CamMgr");

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

var ImagesMgr = React.createClass({
	mixins: [IssueMixin, ViewMixin],
	propTypes: {
		images: PropTypes.object,
		lookups: PropTypes.object,
		setImages: PropTypes.func,
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
	  },
	  icon: {
	    alignSelf: "center",
	    color: "#848484",
	    fontSize: 100,
	    textAlign: "center"
	  }
	}),
	_imgDims: null,

	getInitialState: function() {
		return {
			camMgrOn: false,
			imgTypeId: null
		}
	},

	compnentWillUnmount: function() {
		
	},

	_setImg: function(stagedImg) {
		var images = _.cloneDeep(this.props.images);

    images[this.state.imgTypeId] = stagedImg;
    this.props.setImages(images, !_.some(images, _.isEmpty));
    this._toggleCamMgr(false);
  },

  _setImgDims: function(e) {
    if ( _.isEmpty(this._imgDims) ) {
      var layout = e.nativeEvent.layout; 
      
      this._imgDims = {
        height: layout.width / this.AspectRatios["4x3"],
        width: layout.width
      }
    } else
      return;
  },

  _toggleCamMgr: function(state, imgTypeId) {
    this.setState({
    	camMgrOn: state,
    	imgTypeId: imgTypeId
    });
  },

  _trashImg: function() {
		var images = _.cloneDeep(this.props.images);

    images[this.state.imgTypeId] = null;
    this.props.setImages(images, this.isDone(images));
    return new Promise.resolve();
  },

  _renderImg: function(imgType) {
  	var imgTypeId = imgType.iid
    	, stagedImg = this.props.images[imgTypeId]
    	, Media, valueState;

    if (_.isEmpty(stagedImg)) {
      Media = <Icon name={"camera"} style={this._styles.icon} />;
      valueState = "off";
    }
    else {
      Media = <Image style={[this._styles.img, this._imgDims]} source={{uri: stagedImg.file.uri}} />
      valueState = "on";
    }
    
    return (
      <TouchableHighlight
        key={imgTypeId}
        onPress={() => this._toggleCamMgr(true, imgTypeId)}
        underlayColor="#A4A4A4"
        style={this._styles.media}>
        <View onLayout={this._setImgDims}>
          {Media}
          <Text style={[this._styles.contentText, this.Styles._textStyle[valueState]]}>{imgType.name}</Text>
        </View>
      </TouchableHighlight>
    );
  },

	render: function() {
		var props = this.props, state = this.state
			, lookups = props.lookups
			, images = props.images
			, imgHost = lookups.hosts["images"]
      , imgTypes = lookups.imgTypes;

		return this.state.camMgrOn
			? (<Modal
          animation={false}
          visible={this.state.camMgrOn}>
          <CamMgr
		        exitCamMgr={() => this._toggleCamMgr(false)}
		        imgHost={imgHost}
		        imgType={lookups.imgTypes[state.imgTypeId]}
		        prevImg={images[state.imgTypeId]}
		        trashImg={() => this._trashImg()}
		        setImg={(img) => this._setImg(img)} />
		    </Modal>)
			: (<View style={this.props.style, {flexDirection: "row", padding: 2}}>{
		      _.map(_.keys(images), (imgTypeId) => {
		        return this._renderImg(imgTypes[imgTypeId]);
		      })}
				</View>);
	},
});

module.exports = ImagesMgr;