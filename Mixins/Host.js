var Storage = require('react-native-store');
var HostDev = {
  getHost: function() {
    let env = "dev";
    
    let host = {
      env: env
      // db: new Firebase("https://cowbell" +(env === "dev" ? "-" +env : "") +".firebaseIO.com")
    };

    return host;
  },

  getStoredModel: function(app, env, model) {
    return Storage.model(app +"-" +env).then((db) => {
      let filter = { where: { "key": model} };

      // return a promise containing the model
      return db.find(filter);
    });  
  },
};

module.exports = HostDev;