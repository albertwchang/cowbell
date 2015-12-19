var HostDev = {
  getHost: function() {
    let env = "dev";
    
    let host = {
      env: env
      // db: new Firebase("https://cowbell" +(env === "dev" ? "-" +env : "") +".firebaseIO.com")
    };

    return host;
  },

  // getStoredModel: function(app, env, model) {
  //   Storage.model(this._host.app +"-" +this._host.env).then((model) => {
  // }
};

module.exports = HostDev;