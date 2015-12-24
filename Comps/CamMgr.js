var Camera = require('react-native-camera');
var Carousel = require("react-native-carousel");
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var Orientation = require('react-native-orientation');
var React = require("react-native");
var Reflux = require("reflux");

// MIXINS
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES
var HostActions = require("../Actions/HostActions");
var HostStore = require("../Stores/HostStore");
var ProfileStore = require("../Stores/ProfileStore");
var IssueActions = require("../Actions/IssueActions");

// Utilities
var Moment = require('moment');
var _ = require("lodash");

var {
	AlertIOS,
	Dimensions,
	Image,
	NativeModules,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var ImageEditing = NativeModules.ImageEditingManager;
var CamMgr = React.createClass({
	propTypes: {
		exitCamMgr: PropTypes.func,
		imgHost: PropTypes.string,
		prevImg: PropTypes.object,
		setImg: PropTypes.func
  },
	mixins: [Reflux.connect(ProfileStore), Reflux.ListenerMixin, ViewMixin],
	cameraRef: null,
	_subscriber: null,
	tabBarHeight: 50,

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
	},

	componentWillUnmount: function () {
		// Orientation.shouldRotate(0);
		Orientation.lockToPortrait();
		Orientation.removeOrientationListener(this._orientationDidChange);
	},

	componentWillUpdate: function(newProps, newState) {
		// if (!this._camMgrOn)
		// 	newProps.exitCamMgr();
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

	_captureImg: function() {
    this.cameraRef.capture((err, imgUri) => {
    	var self = this;
    	let imgEditor = NativeModules.ImageEditingManager;
    	if (err) {
    		// future:  create an alert for this problem
    		console.log("Img couldn't be captured");
    		return;
    	}

    	IssueActions.buildImgObj.triggerPromise(imgUri).then((imgObj) => {
    		self.setState({ cameraOn: false, stagedImg: imgObj });
    	}).catch((err) => {
    		console.log("something went wrong");
    	});
    });
  },

  _initCamMgrExit: function() {
  	// this._orientationDidChange(this.Orientations.PORTRAIT);
  	this._toggleCamera(false);
  },

  _orientationDidChange: function(newOrientation) {
		var x = Dimensions.get("window").width;
		
		if (!newOrientation)
			return;

		console.log("New Orientation: ", newOrientation);
		var Orientations = this.Orientations;
		this.setState({
			orientation: (newOrientation.toLowerCase() === Orientations.PORTRAIT.toLowerCase()) ? Orientations.PORTRAIT: Orientations.LANDSCAPE
		});
	},

	_resetStagedImg: function() {
  	return {
			dbRecord: null,
      file: null,
      isSet: false
    };
  },

  // _selectImg: function() {
  // 	AlertIOS.alert(
		//   'Select from Photo Album',
		//   'Will be implemented later...',
		//   [{text: 'Okay'}]
		// );
  // },

  _setCameraRef: function(ref) {
  	this.cameraRef = ref;
  },

  _toggleCamera: function(state) {
		this.setState({ cameraOn: state, spinnerOn: false });
	},

	_toggleFlashMode: function(mode) {
		this.setState({flashMode: mode});
	},

	_trashImg: function() {
		let props = this.props;
		
		this.setState({	spinnerOn: true });
		new Promise((resolve, reject) => {
			// 1. check for 'stagedImg'
			if ( !_.isEmpty(this.state.stagedImg.file) ) {
				this.setState({ stagedImg: this._resetStagedImg() });
				resolve();
			} else if (props.prevImg || props.stagedImg) {
				/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					Q: How to refresh "prevImg" object?
					Problem: "passProps" does not automatically refresh given that
									inputHelperScene was pushed onto Navigation stack
				!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
				props.setImg(null, resolve, reject);
				/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	 				Need to remove from Amazon S3
				!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
			}	
		}).then(() => {
			this._toggleCamera(true);
		});
	},

	render: function() {
		let props = this.props, state = this.state
			, orientation = state.orientation
			, controlPanelDims = null
			, viewDims = null
			, mainBoxStyle = null
		
		let values = {
			min: Math.min(Display.width, Display.height),
			max: Math.max(Display.width, Display.height)
		};

		if (orientation === this.Orientations.PORTRAIT) {
			mainBoxStyle = {flexDirection: "column"};
			controlPanelDims = {
				height: this.tabBarHeight,
				width: values.min
				// width: Display.width
			};

			viewDims = {
				height: values.max,
				// height: Display.height,
				width: values.min
				// width: Display.width
			};
		} else {
			mainBoxStyle = {flexDirection: "row"};
			controlPanelDims = {
				height: values.min,
				// height: Display.height,
				width: this.tabBarHeight
			};

			viewDims = {
				height: values.min,
				// height: Display.height,
				width: values.max
				// width: Display.width
			};
		}

		return (
			<View style={mainBoxStyle}>
				<MediaView
					cameraOn={state.cameraOn}
					dims={viewDims}
					flashMode={state.flashMode}
					imgHost={props.imgHost}
					orientation={orientation}
					prevImg={props.prevImg}
					setCameraRef={this._setCameraRef}
					stagedImg={props.stagedImg || state.stagedImg} />
				<ControlPanel
					acceptImg={this._acceptImg}
					cameraOn={state.cameraOn}
					captureImg={this._captureImg}
					exitCamMgr={this._initCamMgrExit}
					flashMode={state.flashMode}
					dims={controlPanelDims}
					orientation={orientation}
					selectImg={this._selectImg}
					toggleFlashMode={this._toggleFlashMode}
					trashImg={this._trashImg} />
			</View>
		);
	}
});


/**********************************************************************************
																	M E D I A   V I E W
**********************************************************************************/
var MediaView = React.createClass({
	mixins: [ViewMixin],
	_styles: {
		saving: null,
	  mediaSection: null
	},
	propTypes: {
		cameraOn: PropTypes.bool,
		dims: PropTypes.object,
		flashMode: PropTypes.bool,
		imgHost: PropTypes.string,
		orientation: PropTypes.string,
		prevImg: PropTypes.object,
		stagedImg: PropTypes.object,
		setCameraRef: PropTypes.func
  },

	componentWillMount: function() {
		this._refreshStyles(this.props);
	},

	componentDidMount: function() {
		if (this.refs["cam"])
			this.props.setCameraRef(this.refs.cam);
	},

	componentDidUpdate: function() {
		if (this.refs["cam"])
			this.props.setCameraRef(this.refs.cam);
	},

	componentWillReceiveProps: function(newProps) {
		this._refreshStyles(newProps);
	},

	_refreshStyles: function(newProps) {
		this._styles.mediaSection = _.assign(newProps.dims, {
			backgroundColor: "#000000",
			justifyContent: 'center'
		});
	},

	render: function() {
		let props = this.props;
		let imgUri = props.stagedImg.file ? props.stagedImg.file.uri
			: (props.prevImg ? props.imgHost +props.prevImg.uri +"?fit=crop&w=" +Display.width +"&h=" +Display.height : undefined);
		
		if (props.cameraOn) {
			return (
				<Camera
					captureTarget={Camera.constants.CaptureTarget.disk}
					flashMode={Camera.constants.FlashMode[props.flashMode ? "on" : "off"]}
					orientation={props.orientation}
		    	ref="cam"
		      style={this._styles.mediaSection}
		      type={Camera.constants.Type.back} />
			);
		} else {
			return (
				<Image
					resizeMode="contain"
					style={this._styles.mediaSection}
					source={ {uri: imgUri} } />
			);
		}
	}
});


/**********************************************************************************
															C O N T R O L   P A N E L
**********************************************************************************/
var ControlPanel = React.createClass({
	mixins: [ViewMixin],
	propTypes: {
		acceptImg: PropTypes.func,
		cameraOn: PropTypes.bool,
		captureImg: PropTypes.func,
		exitCamMgr: PropTypes.func,
		flashMode: PropTypes.bool,
		dims: PropTypes.object,
		orientation: PropTypes.string,
		selectImg: PropTypes.func,
		toggleFlashMode: PropTypes.func,
		trashImg: PropTypes.func
  },
  _buttons: {},
	getDefaultProps: function() {
		return {
			acceptImg: null,
			cameraOn: false,
			captureImg: null,
			exitCamMgr: null,
			dims: null,
			orientation: "",
			selectImg: null,
			trashImg: null,
		}
	},

	getInitialState: function() {
		return {
			flashlightState: false
		}
	},

	componentWillMount: function() {
		let props = this.props
			, onColor = this.Colors.night.section;

		this._buttons["on"] = [
  		{icon: ["flash-off", "ios-bolt-outline"], action: props.toggleFlashMode, color: onColor},
  		{icon: "android-camera", action: props.captureImg, color: onColor},
  		{icon: "ios-close-outline", action: props.exitCamMgr, color: onColor}
	  ];

	  this._buttons["off"] = [
  		{icon: "ios-checkmark-outline", action: props.acceptImg, color: "#01DF01"},
			{icon: "ios-trash-outline", action: props.trashImg, color: "#FF0000"}
  	];
	},

	render: function() {
		let borderWidth = 1
			, dims = this.props.dims
			, orientation = this.props.orientation
			, padding = 2;
		
		let styles = {
			btn: {
				flex: 1,
			},
			btnIcon: {
				alignSelf: "center",
				color: "#A4A4A4",
				fontSize: 0
			},
			controlPanel: null
		};

		if (orientation === this.Orientations.PORTRAIT) {
			styles.btnIcon.fontSize = dims.height - 2*padding - borderWidth;
			styles.controlPanel = {
				alignItems: "center",
				bottom: 0,
				backgroundColor: "#2E2E2E",
				borderTopWidth: borderWidth,
			  borderColor: '#A4A4A4',
				flexDirection: "row",
				height: dims.height,
				paddingVertical: padding,
				position: "absolute",
				width: dims.width,
			}
		} else {
			styles.btnIcon.fontSize = dims.width - 2*padding - borderWidth;
			styles.controlPanel = {
				alignItems: "center",
				backgroundColor: "#2E2E2E",
				borderRightWidth: borderWidth,
			  borderColor: '#A4A4A4',
				flexDirection: "column",
				height: dims.height,
				paddingHorizontal: padding,
				position: "absolute",
				left: 0,
				width: dims.width,
			}
		}
		
		if (this.props.cameraOn) {
			// <TouchableHighlight
			// 	onPress={this.props.selectImg}
			// 	style={styles.btn}>
			// 	<Icon
			// 		name={"images"}
			// 		style={ [styles.btnIcon] } />
			// </TouchableHighlight>

			return (
				<View style={styles.controlPanel}>
					<TouchableHighlight
						onPress={() => this.props.toggleFlashMode(!this.props.flashMode)}
						style={styles.btn}>
						<Icon
							name={this.props.flashMode ? "flash-off" : "ios-bolt-outline"}
							style={ [styles.btnIcon] } />
					</TouchableHighlight>
					<TouchableHighlight
						onPress={this.props.captureImg}
						style={styles.btn}>
						<Icon
							name={"android-camera"}
							style={ [styles.btnIcon] } />
					</TouchableHighlight>
					<TouchableHighlight
						onPress={this.props.exitCamMgr}
						style={styles.btn}>
						<View>
							<Icon
								name={"ios-close-outline"}
								style={ [styles.btnIcon] } />
						</View>
					</TouchableHighlight>
				</View>
			);
		} else {
			return (
				<View style={[ styles.controlPanel ]}>
					<View style={styles.btn}></View>
					<TouchableHighlight
						onPress={this.props.acceptImg}
						style={styles.btn}>
						<Icon
							name={"ios-checkmark-outline"}
							style={ [styles.btnIcon, {color: "#01DF01"}] } />
					</TouchableHighlight>
					<TouchableHighlight
						onPress={this.props.trashImg}
						style={styles.btn}>
						<Icon
							name={"ios-trash-outline"}
							style={ [styles.btnIcon, {color: "#FF0000"}] } />
					</TouchableHighlight>
					<View style={styles.btn}></View>
				</View>
			);
		}
	}
})

module.exports = CamMgr;