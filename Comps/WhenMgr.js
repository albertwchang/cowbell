'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require("react-native-vector-icons/Ionicons");
var React = require("react-native");
var PickerIOS = require('react-native-multipicker');

// COMPONENTS
var LineSeparator = require('../Comps/LineSeparator');
var SavePanel = require('../Comps/SavePanel');

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var Moment = require("moment");
var _ = require("lodash");

var MAX_HOURS = 12
	, HOURS = [1,2,3,4,5,6,7,8,9,10,11,12]
	, MINUTES = [0,5,10,15,20,25,30,35,40,45,50,55]
	, PRIOR_DAY_COUNT = 10
	, MERIDIEMS = new Array("AM", "PM");
	
var {
	AlertIOS,
	PropTypes,
	StatusBarIOS,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var WhenScene = React.createClass({
	mixins: [SiteMixin, ViewMixin],
	propTypes: {
		buttons: PropTypes.array,
		closeDisplay: PropTypes.func,
		initialVal: PropTypes.string,
		lookups: PropTypes.object,
		setDate: PropTypes.func,
		style: PropTypes.number,
  },

	_styles: StyleSheet.create({
		main: {
			backgroundColor: "#000000",
			flexDirection: "column",
			height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
			width: Display.width,
		},
		dateDisplay: {
			backgroundColor: "#2E2E2E",
			borderColor: "#A4A4A4",
			borderBottomWidth: 0.5,
			flexDirection: "row",
			paddingVertical: 10,
			paddingHorizontal: 3,
		}, ddText: {
			color: "#01DF01",
			fontFamily: "System",
			fontSize: 20,
			fontWeight: "200",
			textAlign: "center",
		}, exit: {
			alignItems: "center",
			backgroundColor: "#1C1C1C",
			borderTopWidth: 1,
			borderColor: "#A4A4A4",
			bottom: 0,
			height: ViewMixin.Dimensions.TAB_BAR_HEIGHT,
			paddingVertical: 3,
			paddingHorizontal: 8,
			position: "absolute",
			width: Display.width,
		}, exitIcon: {
			color: "#31B404",
			fontSize: 44,
		}
	}),
	_meridiemIndex: -1,
	_priorDays: [],

	getInitialState: function() {
		let date = Moment().toDate();
		date.setHours(0);
		date.setMinutes(0);
		date.setSeconds(0);
		
		return {
			chosenDate: date
		};
	},

	componentWillMount: function() {
		this._priorDays = _.times(PRIOR_DAY_COUNT, (priorDay) => {
			return Moment().subtract(priorDay, 'day')._d;
		}).reverse();

		this._propose(this.state.chosenDate)["date"]();
	},

	componentWillUpdate: function(newProps, newState) {
		this._vetProposedTimestamp(newState.chosenDate);
	},

	_adjustMinute: function(date) {
		let minute = date.getMinutes()
			, minutes = {
			floor: _.floor(minute, -1),
			rounded: _.round(minute, -1)
		};

		var newMinutes;
		
		if (minutes.floor === minutes.rounded)
			newMinutes = minutes.floor;
		else {
			var ceilingIndex = _.indexOf(MINUTES, minutes.floor) + 1;
			newMinutes = MINUTES[ceilingIndex];
		}

		return Moment(date.setMinutes(newMinutes)).toDate();
	},

	_findMeridiemIndex: function(date) {
		return (date.getHours() < 12) ? 0 : 1;
	},

	_getChosenDateCopy: function() {
		return _.cloneDeep(this.state.chosenDate);
	},

	_getNow: function() {
		var now = Moment().toDate();
		
		if ( !_.contains(MINUTES, now.getMinutes()) )
			now = this._adjustMinute(now);

		return now;
	},

	_propose: function(newTimestamp) {
		return {
			date: () => {
				// set entire date
				let minutes = this._adjustMinute(newTimestamp).getMinutes();
				// newTimestamp.setSeconds(0);

				this._updateTimestamp(newTimestamp);
			},

			day: () => {
				// set everything day, month, and year
				let prevChosenDate = this._getChosenDateCopy();
				prevChosenDate.setDate(newTimestamp.getDate());
				prevChosenDate.setMonth(newTimestamp.getMonth());
				prevChosenDate.setYear(newTimestamp.getFullYear());

				this._updateTimestamp(prevChosenDate);
			},
			meridiem: () => {
				// set the time only -- in 24 hours
				let prevChosenDate = this._getChosenDateCopy();
				prevChosenDate.setHours(newTimestamp.getHours());

				this._updateTimestamp(prevChosenDate);
			},
			time: () => {
				// set time only
				let prevChosenDate = this._getChosenDateCopy();
				prevChosenDate.setSeconds(0);
				prevChosenDate.setMinutes(newTimestamp.getMinutes());
				prevChosenDate.setHours(newTimestamp.getHours());

				this._updateTimestamp(prevChosenDate);
			}
		}
	},

	_resetTimestamp: function(setState) {
		let initialDate = _.isEmpty(this.props.initialVal) ? "" : Moment(this.props.initialVal).toDate()
			, newDate = initialDate || this._getNow();

		newDate.setSeconds(0);
		this._meridiemIndex = this._findMeridiemIndex(newDate);

		if (setState)
			this.setState({chosenDate: newDate});
		else
			return newDate;
	},

	_setTimestamp: function() {
		this.props.closeDisplay();
		this.props.setDate(Moment(this.state.chosenDate).format());
	},

	_updateTimestamp: function(updatedTimestamp) {
		this._meridiemIndex = this._findMeridiemIndex(updatedTimestamp);
		this.setState({chosenDate: updatedTimestamp});
	},

	_vetProposedTimestamp: function(newDate) {
		var now = this._getNow();

		if ( Moment(newDate).isAfter(now) || Moment(newDate).isSame(now) ) {
			AlertIOS.alert('Oops!', 'You selected a future date/time', [{text: 'OK'}]);
			this._updateTimestamp(now);
		}
	},

	render: function() {
		var DateDisplay
			, state = this.state
			, chosenDate = state.chosenDate;

		if ( !_.isDate(chosenDate) || _.isEmpty(chosenDate.toString()) ) {
			DateDisplay =
				<View style={this._styles.dateDisplay}>
					<Text style={ [this._styles.ddText, {flex: 1}] }>
						-- No date and time selected -- 
					</Text>
				</View>			
		} else {
			DateDisplay =
				<View style={this._styles.dateDisplay}>
					<Text style={ [this._styles.ddText, {flex: 5}] }>
						{Moment(chosenDate).format("ddd, MMM Do, YYYY")}
					</Text>
					<Text style={ [this._styles.ddText, {flex: 2}] }>
						{Moment(chosenDate).format("h:mm")}
					</Text>
					<Text style={ [this._styles.ddText, {flex: 1}] }>
						{MERIDIEMS[this._meridiemIndex]}
					</Text>
				</View>
		}

		var boxStyle = {
			backgroundColor: "#000000",
			bottom: this.Dimensions.STATUS_BAR_HEIGHT,
			flexDirection: "column",
			height: Display.height,
			justifyContent: "flex-end",
			width: Display.width,
		};

		return (
			<View style={boxStyle}>
				<ConvenienceButtons
					chosenDate={chosenDate}
					options={this.props.buttons}
					propose={this._propose} />
				<LineSeparator height={0} vertMargin={8} />
				{DateDisplay}
				<LineSeparator height={0} vertMargin={8} />
				<PickerSection
					chosenDate={chosenDate}
					meridiemIndex={this._meridiemIndex}
					priorDays={this._priorDays}
					propose={this._propose} />
				<SavePanel
					setItem={this._setTimestamp}
					trashItem={this._resetTimestamp} />
			</View>
		);
	}
});

/***********************************************************************************************
************************************************************************************************
																	P I C K E R    S E C T I O N

***********************************************************************************************/
var PickerSection = React.createClass({
	propTypes: {
		chosenDate: PropTypes.object,
		meridiemIndex: PropTypes.number,
		priorDays: PropTypes.array,
		propose: PropTypes.func
  },

	_styles: StyleSheet.create({
		shell: {
			alignSelf: "center",
			backgroundColor: "#31B404",
			marginHorizontal: 4,
			width: Display.width,
		},
	}),

	_applyMeridiem: function(meridiem, hour) {
		if ( meridiem == "AM" && hour > 11 )
			hour -= 12;
		else if ( meridiem == "PM" && hour < 12)
			hour += 12;

		return hour;
	},

	_getChosenDateCopy: function() {
		return _.cloneDeep(this.props.chosenDate);
	},

	_prep: function() {
		let props = this.props;

		return {
			date: (e) => {
				let proposedDate = Moment(e.newValue).toDate()
					, chosenDate = this._getChosenDateCopy()
					, dateFormat = "M d YYYY";

				if ( Moment(chosenDate).format(dateFormat) !== Moment(proposedDate).format(dateFormat) )
					this._submitTimestamp(proposedDate, "date");
			},

			day: (e) => {
				let chosenDate = this._getChosenDateCopy()
					, proposedDate = this._getChosenDateCopy()
					, dateFormat = "M DD YYYY"
					, newDate = Moment(e.newValue).toDate();

				proposedDate.setDate(newDate.getDate());
				proposedDate.setMonth(newDate.getMonth());
				proposedDate.setFullYear(newDate.getFullYear());

				if ( Moment(chosenDate).format(dateFormat) !== Moment(proposedDate).format(dateFormat) )
					this._submitTimestamp(proposedDate, "date");
			},

			hour: (e) => {
				let newHour = parseInt(e.newValue)
					, chosenDate = this._getChosenDateCopy();
				
				if (chosenDate.getHours() !== newHour) {
					newHour = this._applyMeridiem(MERIDIEMS[props.meridiemIndex], newHour);
					chosenDate.setHours(newHour);
					this._submitTimestamp(chosenDate, "time");	
				}
			},

			meridiem: (e) => {
				let newMeridiem = e.newValue.toUpperCase()
					, chosenDate = this._getChosenDateCopy()
					, newHour = chosenDate.getHours();

				if (newMeridiem !== MERIDIEMS[props.meridiemIndex]) {
					newHour = this._applyMeridiem(newMeridiem, newHour);
					chosenDate.setHours(newHour);
					this._submitTimestamp(chosenDate, "meridiem");	
				}
			},

			minute: (e) => {
				let newMinute = parseInt(e.newValue)
					, chosenDate = this._getChosenDateCopy();
				
				if (chosenDate.getMinutes() !== newMinute) {
					chosenDate.setMinutes(newMinute);
					this._submitTimestamp(chosenDate, "time");	
				}
			}
		}
	},

	_submitTimestamp: function(proposedTimestamp, method) {
		let proposedDate = Moment(proposedTimestamp).toDate();
		this.props.propose(proposedDate)[method]();
	},

	render: function() {
		let props = this.props
			, chosenDate = _.isDate(props.chosenDate) ? props.chosenDate : Moment().toDate()
			, chosenHour = chosenDate.getHours()
			, index = {
			day: PRIOR_DAY_COUNT - Moment().startOf("day").diff( Moment(chosenDate).startOf("day"), "days" ) - 1,
			minute: _.indexOf(MINUTES, chosenDate.getMinutes()),
			hour: _.indexOf(HOURS, (chosenHour > 0 && chosenHour < 13) ? chosenHour : Math.abs(chosenHour - MAX_HOURS)),
			meridiem: props.meridiemIndex,
		}

		return (
			<PickerIOS style={this._styles.shell}>
        <PickerIOS.Group
        	key="day"
        	selectedIndex={index["day"]}
        	onChange={(e) => this._prep()["day"](e)}
        	style={{flex: 3}}>
          {
          	props.priorDays.map((day, index) => (
          		<PickerIOS.Item key={index} value={day} label={Moment(day).format("MM/DD").toString()} />
          	))
	        }
   			</PickerIOS.Group>
   			
   			<PickerIOS.Group
   				key="hour"
        	selectedIndex={index["hour"]}
        	onChange={(e) => this._prep()["hour"](e)}
        	style={{flex: 1}}>
          {
          	HOURS.map((hour, index) => (
          		<PickerIOS.Item key={index} value={hour.toString()} label={hour.toString()} />
	        	))
	        }
   			</PickerIOS.Group>

   			<PickerIOS.Group
   				key="minute"
        	selectedIndex={index["minute"]}
        	onChange={(e) => this._prep()["minute"](e)}
        	style={{flex: 1}}>
          {
          	_.map(MINUTES, (minute, index) => {
          		let minString = ":" +((minute < 10) ? "0" : "") +minute.toString();
          		return <PickerIOS.Item key={index} value={minute.toString()} label={minString} />;
	        	})
	        }
   			</PickerIOS.Group>
   			<PickerIOS.Group
   				key="meridiem"
        	onChange={(e) => this._prep()["meridiem"](e)}
        	selectedIndex={index["meridiem"]}
        	style={{flex: 1}}>
          {
          	MERIDIEMS.map((meridiem, index) => (
          		<PickerIOS.Item key={index} value={meridiem} label={meridiem} />
	        	))
	        }
   			</PickerIOS.Group>
      </PickerIOS>
		);
	},
});


/***********************************************************************************************
************************************************************************************************
									C O N V E N I E N C E   B U T T O N S   S E C T I O N

***********************************************************************************************/
var ConvenienceButtons = React.createClass({
	propTypes: {
		chosenDate: PropTypes.object,
		options: PropTypes.array,
		propose: PropTypes.func,
  },

	_styles: StyleSheet.create({
		shell: {
			flexDirection: "column",
			width: Display.width,
		},
		dateBtn: {
			borderRadius: 4,
			flex: 1,
			marginHorizontal: 4,			
			marginVertical: 4,
		}, dateBtnOn: {
			backgroundColor: "#DF7401"
		},dateBtnOff: {
			backgroundColor: "#2E2E2E",
			borderColor: "#DF7401",
			borderWidth: 1
		}, 
		dateBtnText: {
			fontFamily: "System",
			fontSize: 42,
			fontWeight: "100",
			letterSpacing: 5,
			textAlign: "center",
		}, dateBtnTextOn: {
			color: "#000000",
		}, dateBtnTextOff: {
			color: "#DF7401",
		} 
	}),

	getDefaultProps: function() {
		return {
			options: []
		}
	},

	render: function() {
		let props = this.props
			, daysFromChosenDate = Moment().startOf("day").diff( Moment(props.chosenDate).startOf("day"), "days" );

		return (
			<View style={this._styles.shell}>{
				_.map(props.options, (option, index) => {
					let [type, value] = option.getTimestamp()
						, daysFromBtnDate = Moment().startOf("day").diff( Moment(value).startOf("day"), "days" )
						, optionIsChosen = (daysFromChosenDate === daysFromBtnDate);
					
					return (
						<View key={index} style={ [this._styles.dateBtn, optionIsChosen ? this._styles.dateBtnOn : this._styles.dateBtnOff] }>
							<TouchableHighlight
								onPress={() => props.propose(value)[type]()}
								underlayColor="#FE9A2E">
								<Text style={ [this._styles.dateBtnText, optionIsChosen ? this._styles.dateBtnTextOn : this._styles.dateBtnTextOff] }>{option.label}</Text>
							</TouchableHighlight>
						</View>
					);
				})}
			</View>
		);
	},
});

module.exports = WhenScene;