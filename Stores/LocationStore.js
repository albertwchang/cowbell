'use strict'

var Reflux = require("reflux");
var LocationActions = require("../Actions/LocationActions");

// UTILITIES
var _ = require("lodash");

var LocationStore = Reflux.createStore({
	listenables: [LocationActions],
	_position: {
		lat: 0.0,
		long: 0.0,
		latitude: 0.0,
		longitude: 0.0,
	},
	
	_positionOptions: {
		enableHighAccuracy: false,
		timeout: 15000,
	},

	getInitialState: function() {
		return {
			position: {
				lat: 0.0,
				long: 0.0,
				latitude: 0.0,
				longitude: 0.0,
			}
		}
	},

	onGetPosition: function(callback) {
		callback(this._position);
	},

	onSetPositionOptions: function(newOptions) {
		this._positionOptions = newOptions;
	},

	onSetPositionStream: function() {
		/*
			NEED TO CREATE MANAGER FOR UNWATCHING AND RE-INITIALIZING
			NEW POSITION WATCHER
		*/
		navigator.geolocation.getCurrentPosition((newPosition) => {
			//success
			// console.log("new position: ", newPosition);
			var lat = newPosition.coords.latitude;
			var long = newPosition.coords.longitude;

			this._position = {
				lat: lat,
				long: long,
				latitude: lat,
				longitude: long,
			};

			this.trigger({position: this._position});
		}, (err) => {
			//error
			console.log("err w/ position: ", err);
		}, this._positionOptions);
	},
});


module.exports = LocationStore;