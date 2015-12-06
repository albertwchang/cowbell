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
	_db: null,
	_lookups: null,

	init: function() {
		this.listenTo(HostStore, this._updateDb, this._updateDb);
	},

	getInitialState: function() {
		return {
			lookups: this._lookups,
		}
	},

	onEndListeners: function() {

	},

	_retrieveLookups: function(table, lookupsRow) {
		var dbRef = this._db;

    dbRef.once("value", (results) => {
    	var lookupsObj = {
        "data": JSON.stringify(results.val().data),
        "key": results.key(),
        "lastUpdated": results.val().lastUpdated,
      };

      if (lookupsRow.length === 0)
    		table.add(lookupsObj);
    	else
    		table.update(lookupsObj);

			this._lookups = results.val().data;
    	this.trigger({lookups: this._lookups});
      LookupActions.validateLookups.completed();
    });
	},

	onValidateLookups: function() {
		Storage.table("towmo").then((table) => {
      var lookupsRow = table.where({
        "key": "lookups"
      }).find();

      if (!lookupsRow || lookupsRow.length == 0) {	
				// No Local Lookups
    		this._retrieveLookups(table, lookupsRow);
      } else {
     		// Ensure no updates have been made to Lookups collection
        var dbRef = this._db.child("lastUpdated");
		
				dbRef.once("value", (results) => {
					if (results.val() == lookupsRow[0].lastUpdated) {
						this.trigger({lookups: this._lookups = JSON.parse(lookupsRow[0].data)});
						LookupActions.validateLookups.completed(this._lookups);
					} else {
						// Outdated Local Lookups
		        this._retrieveLookups(table, lookupsRow);
					}
				});
      }
		});
	},

	_updateDb: function(data) {
		this._db = data.db.child("lookups");
	},
});


module.exports = LookupStore;