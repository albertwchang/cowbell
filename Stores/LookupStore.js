'use strict'
var Reflux = require("reflux");

// MIXINS
var HostMixin = require("../Mixins/Host");
var StorageMixin = require("../Mixins/Storage");

// ACTIONS && STORES
var HostStore = require("./HostStore");
var LookupActions = require("../Actions/LookupActions");

// UTILITIES
var _ = require("lodash");

var LookupStore = Reflux.createStore({
	listenables: [LookupActions],
  mixins: [HostMixin, StorageMixin],
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
		};
	},

	onEndListeners: function() {

	},

	_retrieveLookups: function(db, lookupsRow, successCb, errCb) {
    let dbRef = this._host.db, params = this._params;
    dbRef.once("value", (results) => {
    	let lookupsObj = {
        "data": JSON.stringify(results.val()[params.data]),
        "key": results.key()
      };

      lookupsObj[params.timestamp] = results.val()[params.timestamp],
    	this.setStoredModel(db, lookupsRow, lookupsObj);
			this._lookups = results.val()[params.data];
    	this.trigger({lookups: this._lookups});
      successCb(this._lookups);
    });
	},

	onValidateLookups: function() {
    let params = this._params
      , callbacks = LookupActions.validateLookups
      , host = this._host;

    this.getLocalDb(host.app, host.env).then((db) => {
      this.getStoredModel(db, this._storeName).then((lookupsRow) => {
        if ( _.isEmpty(lookupsRow) )
          // No Local Lookups
          this._retrieveLookups(db, lookupsRow, callbacks.completed, callbacks.failed);
        else {
          // Ensure no updates have been made to Lookups collection
          let dbRef = host.db.child(params.timestamp);
          dbRef.once("value", (results) => {
            if (results.val() == lookupsRow[0][params.timestamp]) {
              this.trigger({lookups: this._lookups = JSON.parse(lookupsRow[0][params.data])});
              LookupActions.validateLookups.completed(this._lookups);
            } else
              // Outdated Local Lookups
              this._retrieveLookups(db, lookupsRow, callbacks.completed, callbacks.failed);
          });
        }
      });
    })
	},

	_setHost: function(data) {
		this._host = _.mapValues(data.host, (value, key) => {
      return (key === "db") ? value.child("lookups") : value;
    });
	},
});


module.exports = LookupStore;