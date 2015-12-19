'use strict'

var Reflux = require("reflux");
var Storage = require('react-native-store');

// ACTIONS && STORES
var HostStore = require("./HostStore");
var LookupActions = require("../Actions/LookupActions");

// UTILITIES
var _ = require("lodash");

var LookupStore = Reflux.createStore({
	listenables: [LookupActions],
	_host: null,
	_lookups: null,
  _params: {
    data: "data",
    timestamp: "lastUpdated"
  },
  _storeName: "lookups",

	init: function() {
		this.listenTo(HostStore, this._setHost, this._setHost);
	},

	getInitialState: function() {
		return {
			lookups: this._lookups,
		}
	},

	onEndListeners: function() {

	},

	_retrieveLookups: function(model, lookupsRow, successCb, errCb) {
    let dbRef = this._host.db, params = this._params;
    dbRef.once("value", (results) => {
    	let lookupsObj = {
        "data": JSON.stringify(results.val()[params.data]),
        "key": results.key()
      };

      lookupsObj[params.timestamp] = results.val()[params.timestamp],
    	model[_.isEmpty(lookupsRow) ? "add" : "update"](lookupsObj);

			this._lookups = results.val()[params.data];
    	this.trigger({lookups: this._lookups});
      successCb(this._lookups);
    });
	},

	onValidateLookups: function() {
    let params = this._params;
		
    Storage.model(this._host.app +"-" +this._host.env).then((model) => {
      let filter = { where: { "key": this._storeName} };
      let callbacks = LookupActions.validateLookups;
      
      model.find(filter).then((lookupsRow) => {
        if ( _.isEmpty(lookupsRow) )
  				// No Local Lookups
      		this._retrieveLookups(model, lookupsRow, callbacks.completed, callbacks.failed);
        else {
       		// Ensure no updates have been made to Lookups collection
          let dbRef = this._host.db.child(params.timestamp);
  				dbRef.once("value", (results) => {
  					if (results.val() == lookupsRow[0][params.timestamp]) {
  						this.trigger({lookups: this._lookups = JSON.parse(lookupsRow[0][params.data])});
  						LookupActions.validateLookups.completed(this._lookups);
  					} else
  						// Outdated Local Lookups
  		        this._retrieveLookups(model, lookupsRow, callbacks.completed, callbacks.failed);
  				});
        }
      });
		});
	},

	_setHost: function(data) {
		this._host = data.host;
    this._host.db = this._host.db.child(this._storeName);
	},
});


module.exports = LookupStore;