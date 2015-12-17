var Firebase = require("firebase");

var HostDev = {
  getHost: function() {
    let env = "dev";
    
    let host = {
      env: env,
      db: new Firebase("https://cowbell" +(env === "dev" ? "-" +env : "") +".firebaseIO.com")
    };

    return host;
  },
};

module.exports = HostDev;