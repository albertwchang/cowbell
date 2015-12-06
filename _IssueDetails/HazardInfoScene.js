'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var React = require("react-native");
var Reflux = require("reflux");

// COMPONENTS
var ActionButtons = require("../Comps/ActionButtons");
var LineSeparator = require("../Comps/LineSeparator");
var MenuSelect = require("../Comps/MenuSelect");
var Pending = require("../Comps/Pending");
var StatusEntry = require("../Comps/StatusEntry");

// MIXINS
var RequestMixin = require("../Mixins/Request");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES
var RequestActions = require("../Actions/RequestActions");

// Utilities
var Moment = require("moment");
var _ = require("lodash");

var {
	ListView,
	Modal,
	PropTypes,
	StyleSheet,
	Text,
	TextInput,
	TouchableHighlight,
	View
} = React;

var VehicleInfoScene = React.createClass({
	propTypes: {
		currentSiteRight: PropTypes.object,
		currentUser: PropTypes.object,
		ds: PropTypes.object,
		lookups: PropTypes.object,
		moveInput: PropTypes.func,
		nav: PropTypes.object,
		openAssistedInput: PropTypes.func,
		request: PropTypes.object,
		sites: PropTypes.object,
		themeColors: PropTypes.array,
		users: PropTypes.array
  },
  mixins: [RequestMixin, ViewMixin],
  _currentWorkflow: "save",
  _ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),
	_prevYears: [], /* FUTURE PLANS:  allow user to adjust settings for how many years back */
	_vehicleFields: {},
	_workflowMessages: {
		"save": ["Waiting to Save", "Trying to Save...", "New status saved!", "Error: Couldn\'t save"],
		"search": ["idle", "Searching Database...", "Great! Vehicle found!!", "Shit! Nothing found!"]
	},
  _styles: StyleSheet.create({
	  main: {
	  	flexDirection: "column",
	  	height: Display.height - ViewMixin.getInnerView()
	  },
	  menuBox: {
			backgroundColor: "#000000",
			height: Display.height,
			flex: 1,
			flexDirection: "column",
			opacity: 0.8,
			padding: 4,
			position: "absolute",
			width: Display.width
		},
	  actionButtons: {
			alignItems: "center",
			bottom: 0,
			flexDirection: "row",
			height: ViewMixin.Dimensions.ACTION_BTN_HEIGHT,
			position: "absolute",
			width: Display.width
		},

			iconView: {
				alignItems: "center",
				backgroundColor: ViewMixin.Colors.night.background,
				flex: 1,
				justifyContent: "center",
				paddingVertical: 7
			}, iconText: {
					color: "#A4A4A4",
					fontSize: 26,
					textAlign: "center"
				},
		submitting: {
		  height: Display.height,
		  justifyContent: "center",
		  width: Display.width
		}
	}),

	getInitialState: function() {
		return {
			options: null,
			showMenu: false,
			vehicleCopy: _.cloneDeep(this.props.request.vehicle),
			vehicleParam: null,
			workflowStages: [
        {
          isActive: true,
          end: false,
          success: true
        }, {
          isActive: false,
          end: false,
          success: true
        }, {
          isActive: false,
          end: true,
          success: true
        }, {
          isActive: false,
          end: true,
          success: false
        }
      ]
		};
	},

	componentWillMount: function() {
		var currentYear = Moment().year();
		
		_.times(50, (n) => {
			var year = (currentYear - n).toString();
			this._prevYears.push(year);
		});

		_.each(this.props.lookups.vehicle.options, (vehicleParam, key) => {
			this._vehicleFields[key] = this._buildField(key, this.props, this.state);
		});
	},

	componentWillUnmount: function() {
		if ( !_.eq(this.state.vehicleCopy, this.props.request.vehicle) )
			console.log("vehicle && vehicleCopy are not the same");
	},

	componentWillUpdate: function(newProps, newState) {
		var oldVehicleCopy = this.state.vehicleCopy;
		
		if ( !_.eq(newProps.request.vehicle, newState.vehicleCopy) ) {
			let newVehicleCopy = newState.vehicleCopy;
			
			_.each(newVehicleCopy, (param, key) => {
				if ( !_.eq(param, oldVehicleCopy[key]) )
					this._vehicleFields[key] = this._buildField(key, newProps, newState);
			});
		}
	},

	_buildField: function(key, props, state) {
		let vehicleCopy = state.vehicleCopy
			, lookups = props.lookups
			, vehicle = lookups.vehicle.options
			, param = vehicle[key]
			, paramRef = vehicleCopy[key]
  		, inputFlex = 8 - (_.has(param, "parts") ? param.parts.length : 0)
  		, request = props.request
			, baseValue = " --- " +param.title +" --- "
			, styles = this._styles
			, themeColor = props.themeColors[props.currentSiteRight.orgTypeId]
			, requiredParams = lookups.todos.triggers.vehicle.group.params;
		
		let done = _.has(param.lengths) ? (paramRef.value.length >= param.lengths.required) : !_.isEmpty(paramRef.value)
			, Content, LeftIcon, RightIcon, options, value
			, viewStyle = done ? {borderColor: themeColor, borderWidth: 1} : ( _.contains(requiredParams, param.iid) ? this.Styles._viewStyle.need : this.Styles._viewStyle.off)
			, textStyle = done ? {color: themeColor} : ( _.contains(requiredParams, param.iid) ? this.Styles._textStyle.need : this.Styles._textStyle.off);

		let fieldStyles = StyleSheet.create({
			param: {
				alignItems: "center",
				backgroundColor: this.Colors.night.section,
				flex: 1,
				flexDirection: "row",
				marginVertical: 5,
				marginHorizontal: 2
			}, input: {
					backgroundColor: this.Colors.night.background,
					borderWidth: 0.5,
					padding: 7
				}, inputText: {
						fontSize: 19,
						fontFamily: "System",
						height: 30,
						letterSpacing: 1
					},
				field: {
					alignItems: "center",
					flexDirection: "row",
					paddingVertical: 12
				}, fieldPart: {
						paddingHorizontal: 4
					}, labelText: {
							fontSize: 17,
							fontFamily: "System",
							fontWeight: "200",
							textAlign: "right"
						},
						valueText: {
							fontSize: 18,
							letterSpacing: 1,
							textAlign: "left"
						},
		})

		if ( _.has(param, "age") )
			options = this._prevYears;
		else if ( _.has(param, "ref") )
			options = lookups[param.ref];
		else
			options = param.options;

		if (_.isEmpty(paramRef.value) || !options)
			value = paramRef.value;
		else
			value = options[paramRef.value] ? options[paramRef.value].name : paramRef.value;

		value = !_.isEmpty(value) ? value.toUpperCase() : value;

		if ( _.contains(lookups.vehicle.accessRights.write, props.currentSiteRight.orgTypeId) ) {
			switch(param.inputWay) {
				case "input":
					Content =
						<View style={[fieldStyles.input, {flex: inputFlex}, viewStyle]}>
							<TextInput
								placeholder={baseValue}
								placeholderTextColor={done ? themeColor : ( _.contains(requiredParams, param.iid) ? "#FA5858" : "#A4A4A4")}
						  	onChangeText={(newValue) => this._updateVehicleCopy(newValue, [param.iid, "value"])}
								style={[fieldStyles.inputText, textStyle]}
								value={value} />
						</View>
					break;

				case "link":
					Content =
						<TouchableHighlight
							onPress={() => props.openAssistedInput(key, [key], paramRef.value)}
							style={[fieldStyles.input, {flex: inputFlex}, viewStyle]}>
					  	<Text style={[fieldStyles.inputText, textStyle]}>{value || baseValue}</Text>
				  	</TouchableHighlight>
					break;

				case "select":
					Content = 
		      	<TouchableHighlight
		      		onPress={() => this._prepMenu(key, options)}
		      		style={[fieldStyles.input, {flex: inputFlex}, viewStyle]}>
						  <Text style={[fieldStyles.inputText, textStyle]}>{value || baseValue}</Text>
					  </TouchableHighlight>
					break;

				default:
					Content = <View style={[styles.input, {flex: inputFlex}, viewStyle]}></View>;
					break;
			}

			return (
				<View key={key} style={fieldStyles.param}>
					{this._renderIcon("left", param, paramRef.value)}
					{Content}
					{this._renderIcon("right", param, paramRef.value)}
				</View>
			);
		}
		else
			return (
				<View key={param.iid} style={fieldStyles.field}>
	      	<View style={ [fieldStyles.fieldPart, {flex: 3}] }>
		      	<Text style={[fieldStyles.labelText, done ? {color: themeColor} : this.Styles._textStyle.off] }>{param.title}</Text>
					</View>			
					<View style={ [fieldStyles.fieldPart, {flex: 7}] }>
						<Text style={ [fieldStyles.valueText, done ? {color: themeColor} : this.Styles._textStyle.off] }>{paramRef.value.toUpperCase() || "----------"}</Text>
					</View>
			  </View>
			);
	},

	_prepMenu: function(vehicleParam, options) {
		this.setState({
			options: _.toArray(options),
			vehicleParam: vehicleParam
		});

		this._toggleMenu(true);
	},

	_resetForm: function() {
		this.setState({
			vehicleCopy: _.cloneDeep(this.props.request.vehicle),
		});
	},

	_saveFormData: function() {
		// compare initial vehicle data vs. vehicleCopy

		// have RequestActions update vehicle Data in Firebase
		this._setWorkflowStage("save", 1);

		RequestActions.setParam.triggerPromise(this.props.request, ["vehicle"], this.state.vehicleCopy)
			.then(() => {
				console.log("New data saved to Firebase...");
				this._setWorkflowStage("save", 2);
			}).catch((err) => {
				console.log("Problem saving to Firebase: ", err);
			});
	},

	_searchVehicleInfo: function(vin) {
		this._setWorkflowStage("search", 1);
		let lookups = this.props.lookups;

		RequestActions.pullVehicleData(vin).then((vehicleData) => {
			this._updateVehicleCopy(vehicleData);
			this._setWorkflowStage("search", 2);
		}).catch((err) => {
			this._setWorkflowStage("search", 3);
		});
	},

	_setWorkflowStage: function(workflow, level) {
    this._currentWorkflow = workflow;
    let workflowStages = _.map(this.state.workflowStages, (stage) => {
      stage.isActive = false;
      return stage;
    });

    workflowStages[level].isActive = true;
    this.setState({
    	workflowStages: workflowStages
    });
  },

  _toggleMenu: function(state) {
		this.setState({
			showMenu: state
		});
	},

  _updateVehicleCopy: function(value, path) {
		if (this.state.showMenu === true)
			this._toggleMenu(false);

		this.setState((oldState, oldProps) => {
			var oldVehicleCopy = _.cloneDeep(oldState.vehicleCopy);
			
			if (_.isEmpty(path))
				_.each(value, (paramValue, param) => {
					oldVehicleCopy[param].value = paramValue;
				});
			else
				_.set(oldVehicleCopy, path, value);
			
			return { vehicleCopy: oldVehicleCopy };
		});
	},

  _renderIcon: function(side, param, paramRefVal) {
  	// determine whether other validation is needed for icon color
  	var iconMeta = _.findWhere(param.parts, {"side": side});
  	
  	if (!iconMeta)
  		return null;
  	else {
  		var obj
	  		, props = this.props
	  		, ref = iconMeta.ref
	  		, themeColor = props.themeColors[props.currentSiteRight.orgTypeId];

	  	if (!_.isEmpty(ref)) {
	  		var condition = {};
				condition[ref.key] = param.iid;
				obj = _.findWhere(props.request[ref.param], condition);
	  	}

	  	var IconView = <Icon name={iconMeta.icon} style={[this._styles.iconText, _.isEmpty(obj) ? this.Styles._textStyle["n/a"] : {color: themeColor}]} />

			return iconMeta.action
				? (<TouchableHighlight
						onPress={() => this._searchVehicleInfo(paramRefVal)}
						style={this._styles.iconView}>
						{IconView}
					</TouchableHighlight>)
				: (<View style={this._styles.iconView}>{IconView}</View>);
  	}
  },

  _renderField: function(param, section, rowId) {		
		return (this._vehicleFields[param.iid]);
  },

	render: function() {
		let props = this.props
			, state = this.state
			, lookups = props.lookups
			, request = props.request
			, lastStatusEntry = _.last(request.statusEntries)
			, statusEntryStyle = StyleSheet.create({
					main: {
						alignItems: "center",
						backgroundColor: props.themeColors[props.currentSiteRight.orgTypeId],
						flexDirection: "row",
						height: this.Dimensions.ACTION_BTN_HEIGHT
					},
					info: {
						flex: 1,
						flexDirection: "row",
						paddingHorizontal: 8
					},
					status: {
						alignSelf: "center",
						color: "#FFFFFF",
						fontSize: 26,
						fontFamily: "System",
						letterSpacing: 1
					}
				})
			, formStyle = StyleSheet.create({
					main: {
						flexDirection: "column",
						height: Display.height - ViewMixin.getInnerView() - this.Dimensions.ACTION_BTN_HEIGHT
					}
				})
			, vehicleCopy = state.vehicleCopy
			, vehicleLookup = props.lookups.vehicle
			, workflowStages = state.workflowStages
			, vehicleParams = _.sortByOrder(lookups.vehicle.options, ["rank"], ["asc"]);
		
		return (
			<View style={this._styles.main}>
	      <ListView
					contentInset={{top: -this.Dimensions.STATUS_BAR_HEIGHT}}
					dataSource={this._ds.cloneWithRows(vehicleParams)}
					initialListSize={vehicleParams.length}
					keyboardShouldPersistTaps={false}
					ref="listView"
					removeClippedSubviews={true}
					renderRow={this._renderField}
					scrollEventThrottle={200} />
				<LineSeparator color="#FFFFFF" height={0.8} horzMargin={0} vertMargin={0} />
				<StatusEntry
					currentUser={props.currentUser}
        	currentSiteRight={props.currentSiteRight}
					lookups={lookups}
					request={request}
					show={{status: true, update: true}}
					sites={props.sites}
					statusEntry={lastStatusEntry}
					styles={statusEntryStyle}
					themeColors={props.themeColors}
					users={props.users} />
				<ActionButtons
					cancel={this._resetForm}
					inputChanged={ !_.eq(state.vehicleCopy, request.vehicle) }
					saveData={this._saveFormData}
					style={this._styles.actionButtons}
					themeColors={props.themeColors[props.currentSiteRight.orgTypeId]} />
				<Modal
					animation={false}
					visible={!workflowStages[0].isActive}>
	        <Pending
	        	workflowMessages={this._workflowMessages[this._currentWorkflow]}
	          workflowStages={workflowStages}
	          setDone={() => this._setWorkflowStage(this._currentWorkflow, 0)}
	          style={this._styles.submitting} />
	      </Modal>
	      <Modal
					animation={false}
					visible={state.showMenu}>
	        <MenuSelect
	        	choice={_.isEmpty(state.vehicleParam) ? null : state.vehicleCopy[state.vehicleParam].value}
	        	ds={this._ds}
	        	options={state.options}
	        	style={this._styles.menuBox}
	        	setValue={(newValue) => this._updateVehicleCopy(newValue, [state.vehicleParam, "value"])} />
	      </Modal>
			</View>
		);
	}
});

module.exports = VehicleInfoScene;