'use strict';

var Camera = require('react-native-camera');
var Carousel = require("react-native-carousel");
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var Orientation = require('react-native-orientation');
var React = require("react-native");
var Reflux = require("reflux");

// COMPONENTS
var ChoiceControl = require('./ChoiceControl');

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES
var HostActions = require("../Actions/HostActions");
var HostStore = require("../Stores/HostStore");
var LocationActions = require("../Actions/LocationActions");
var ProfileStore = require("../Stores/ProfileStore");
var IssueActions = require("../Actions/IssueActions");

// Utilities
var _ = require("lodash");

var { AlertIOS, Dimensions, Image, NativeModules, PropTypes, StyleSheet, Text, TouchableHighlight, View } = React;
var ImageEditing = NativeModules.ImageEditingManager;
var Styles = {
	main: null,
	media: {
		backgroundColor: "#000000",
		justifyContent: 'center'
	},
	btn: {
		flex: 1,
	},
	btnIcon: {
		alignSelf: "center",
		color: ViewMixin.Colors.night.text,
		fontSize: 0
	},
	controlPanel: {
		alignItems: "center",
		bottom: 0,
		backgroundColor: "#2E2E2E",
		borderTopWidth: 0,
	  borderColor: '#A4A4A4',
		flexDirection: "row",
		height: 0,
		paddingVertical: 0,
		position: "absolute",
		width: 0,
	}
};
var CamMgr = React.createClass({
	propTypes: {
		exitCamMgr: PropTypes.func,
		imgHost: PropTypes.string,
		prevImg: PropTypes.object,
		setImg: PropTypes.func
  },
	mixins: [Reflux.ListenerMixin, ViewMixin, IssueMixin, Reflux.connect(ProfileStore)],
	_camRef: "cam",
	_dims: {
		controlPanel: {},
		media: {}
	},

	getInitialState: function() {
		return {
			cameraOn: !this.props.prevImg && !this.props.stagedImg,
			flashMode: false,
			orientation: Display.isLandscape() ? this.Orientations.LANDSCAPE : this.Orientations.PORTRAIT,
			spinnerOn: false,
			stagedImg: this._resetStagedImg(),
		};
	},

	componentWillMount: function() {
		// Orientation.shouldRotate(1);
		Orientation.unlockAllOrientations();
		Orientation.addOrientationListener(this._orientationDidChange);
	  this._calcDims();
	  this._buildControlPanel();
	  // this._buildMediaView();
	},

	componentWillUpdate: function(newProps, newState) {
		if (  !_.eq(newState.orientation, this.state.orientation) ) {
			this._calcDims();
			this._buildControlPanel();
		}
	},

	componentWillUnmount: function () {
		// Orientation.shouldRotate(0);
		Orientation.lockToPortrait();
		Orientation.removeOrientationListener(this._orientationDidChange);
	},

	_acceptImg: function() {
		let { prevImg, stagedImg, setImg, exitCamMgr } = this.props;
		/***********************************************************
		 	1. set the Img
			 	a: if prevImg exists, simply leave
			 	b. else (stagedImg is populated) add stagedImg to Issue object
		************************************************************/	
		if (!prevImg && !stagedImg) {
			/************************************************************
			 Need to add ActivityIndicator until img is added to Firebase
			************************************************************/ 
			// this._setImg(this.state.stagedImg, this.props.issueId);
			this.setState({ spinnerOn: true });

			// InputHelperSceen saves stagedImg to Firebase, while VehicleScene
			// will assign the staged Img to another staged Img obj
			// this.props.setImg(this.state.stagedImg).then(() => {
			setImg(this.state.stagedImg);
	  	// this._initCamMgrExit();
		}
		
		exitCamMgr();
	},

	_buildControlPanel: function() {
		let { prevImg, imgHost } = this.props
			, { stagedImg, cameraOn, orientation } = this.state
			, borderWidth = 1, padding = 2;

		let cp = "controlPanel";
		_.assign(Styles.btnIcon, {
			fontSize: this._dims[cp].height - 2*padding - borderWidth
		});
		_.assign(Styles[cp], {
			borderTopWidth: borderWidth,
			height: this._dims[cp].height,
			paddingVertical: padding,
			width: this._dims[cp].width
		});

		_.assign(Styles.media, this._dims.media);
	},

	// _buildMediaView: function() {
	// 	let { prevImg, imgHost } = this.props
	// 		, { cameraOn, flashMode, stagedImg, orientation } = this.state;
		
	// 	if (cameraOn) {
	// 		this._MediaView =
	// 			<Camera
	// 				captureTarget={Camera.constants.CaptureTarget.disk}
	// 				flashMode={Camera.constants.FlashMode[flashMode ? "on" : "off"]}
	// 				orientation={orientation}
	// 	    	ref={this._camRef}
	// 	      style={Styles.media}
	// 	      type={Camera.constants.Type.back} />
	// 	} else {
	// 		let imgUri = stagedImg.file ? stagedImg.file.uri
	// 			: (prevImg ? imgHost +prevImg.uri +"?fit=crop&w=" +Display.width +"&h=" +Display.height : undefined);
			
	// 		this._MediaView =
	// 			<Image resizeMode="contain" style={Styles.media} source={ {uri: imgUri} } />;
	// 	}
	// },

	_calcDims: function() {
		let direction, minSizeParam, maxSizeParam;
		
		if (this.state.orientation === this.Orientations.PORTRAIT) {
			direction = "column";
			maxSizeParam = "height";
			minSizeParam = "width";
		} else {
			direction = "row";
			maxSizeParam = "width";
			minSizeParam = "height";
		}

		Styles.main = { flexDirection: direction };
		this._dims.controlPanel[maxSizeParam] = this.Dimensions.TAB_BAR_HEIGHT;
		this._dims.controlPanel[minSizeParam] = Math.min(Display.width, Display.height);
		this._dims.media[maxSizeParam] = Math.max(Display.width, Display.height);
		this._dims.media[minSizeParam] = Math.min(Display.width, Display.height);
  },

	_captureImg: function() {
    this.refs[this._camRef].capture((err, imgUri) => {
    	// var self = this;s
    	let imgEditor = NativeModules.ImageEditingManager;
    	
    	if (err) {
    		// future:  create an alert for this problem
    		AlertIOS.alert("Can't capture Img:", err
    			, [{ text: 'Okay', onPress: function() {
    				console.log("testing");
    			}}]
    			, 'default');
    	}

    	// IssueActions.buildImgObj.triggerPromise(imgUri).then((imgObj) => {
    	// 	self.setState({ cameraOn: false, stagedImg: imgObj });
    	// }).catch((err) => {
    	// 	console.log("something went wrong");
    	// });

    	LocationActions.getPosition((position, err) => {
    		if (err) {
					console.log("Couldn't create image -- problem w/ Geo position");
					return;
    		} else {
  				let imgObj = this.buildImgObj(imgUri, this.state.currentUser.iid);
    	
	    		_.set(imgObj, ["dbRecord", "geoPoint"], {
		        lat: position.lat,
		        latitude: position.lat,
		        long: position.long,
		        longitude: position.long
	    		});

	    		this.setState({ cameraOn: false, stagedImg: imgObj });	
  			}
    	})
    });
  },

  _getImgUri: function(img) {
  	let imgUri = ""
  		, imgHost = this.props.imgHost;
  	
  	if ( _.isEmpty(imgHost) )
  		imgUri = img.file.uri;
  	else if ( _.isEmpty(img) )
  		return;
  	else
  		imgUri = imgHost +img.uri +"?fit=crop&w=" +Display.width +"&h=" +Display.height;

  	return imgUri;
  },

  // _initCamMgrExit: function() {
  	// this._orientationDidChange(this.Orientations.PORTRAIT);
  	// this._toggleCamera(false);
  // },

  _orientationDidChange: function(newOrientation) {
		if (!newOrientation)
			return;

		console.log("New Orientation: ", newOrientation);
		var Orientations = this.Orientations;
		this.setState({
			orientation: (newOrientation.toLowerCase() === Orientations.PORTRAIT.toLowerCase()) ? Orientations.PORTRAIT: Orientations.LANDSCAPE
		});
	},

	_resetStagedImg: function() {
  	return { dbRecord: null, file: null, isSet: false };
  },

  // _selectImg: function() {
  // 	AlertIOS.alert(
		//   'Select from Photo Album',
		//   'Will be implemented later...',
		//   [{text: 'Okay'}]
		// );
  // },

  _toggleCamera: function(state) {
		this.setState({ cameraOn: state, spinnerOn: false });
	},

	_toggleFlashMode: function(mode) {
		this.setState({flashMode: mode});
	},

	_trashImg: function() {
		let props = this.props, qSetImg
			, endState = { cameraOn: true, spinnerOn: false }
		
		if ( !_.isEmpty(props.imgHost) )
			this.setState({	spinnerOn: true });
		
		// 1. check for 'stagedImg'
		if ( !_.isEmpty(this.state.stagedImg.file) ) {
			_.assign( endState, {stagedImg: this._resetStagedImg()} );
			qSetImg = new Promise.resolve();
		} else if ( !_.isEmpty(props.prevImg) || !_.isEmpty(props.stagedImg) ) {
			/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				Q: How to refresh "prevImg" object?
				Problem: "passProps" does not automatically refresh given that
								inputHelperScene was pushed onto Navigation stack
			!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
			qSetImg = new Promise((resolve, reject) => {
				props.setImg(null, resolve, reject);
			});
			/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 				Need to remove from Amazon S3
			!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
		}

		qSetImg.then(() => {
			this.setState(endState)
		});
	},

	render: function() {
		let { exitCamMgr, prevImg, imgHost } = this.props
			, { cameraOn, flashMode, stagedImg, orientation } = this.state;
		
		if (this.state.cameraOn) {
			let { _toggleFlashMode, _captureImg } = this;
			let buttons = [
	  		{icon: "ios-bolt-outline", action: _toggleFlashMode},
				{icon: "android-camera", action: _captureImg},
				{icon: "ios-close-outline", action: exitCamMgr}
		  ];

		  return (
				<View style={Styles.main}>
					<Camera
						captureTarget={Camera.constants.CaptureTarget.disk}
						flashMode={Camera.constants.FlashMode[flashMode ? "on" : "off"]}
						orientation={orientation}
			    	ref={this._camRef}
			      style={Styles.media}
			      type={Camera.constants.Type.back} />
			    <View style={Styles.controlPanel}>
						{buttons.map((btn, index) => (
							<TouchableHighlight key={index} onPress={btn.action} style={Styles.btn}>
								<Icon name={btn.icon} style={Styles.btnIcon} />
							</TouchableHighlight>	
						))}
					</View>
				</View>
			);
		}
		else {
			let imgUri = _.isEmpty(stagedImg.file) ? this._getImgUri(prevImg) : stagedImg.file.uri;

			return (
				<View style={Styles.main}>
			    <Image resizeMode="contain" style={Styles.media} source={ {uri: imgUri} } />
					<ChoiceControl accept={this._acceptImg}	styles={Styles} trash={this._trashImg} />
				</View>
			);
		}
	}
});

module.exports = CamMgr;