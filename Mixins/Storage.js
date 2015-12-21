var Store = require('react-native-store');
var _ = require("lodash");

var Storage = {
  getLocalDb: function(app, env) {
    return Store.model(app +"-" +env);
  },

  getStoredModel: function(db, model) {
    let filter = { where: { "key": model} };

    // return a promise containing the model
    return db.find(filter);
    // return db.remove(filter);
  },

  setStoredModel: function(db, dbModel, newData) {
    let action = _.isEmpty(dbModel) ? "add" : "update";
    db[action](newData);
  }
};

module.exports = Storage;