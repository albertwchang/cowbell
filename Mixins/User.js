var _ = require("lodash");

var User = {
  _defaultFormat: {
    first: {
      initial: false,
      full: true
    },
    middle: {
      initial: false,
      full: true
    },
    last: {
      initial: false,
      full: true
    }
  },
 	buildName: function(nameObj, format) {
    format = _.isEmpty(format) ? this._defaultFormat : format;
    
    return _.transform(nameObj, function(result, value, key) {
      if ( _.isEmpty(value) )
        return;
      else
        result +(format[key].initial ? value.charAt(0) +". " : value +" ");
    });
  },
  getFormat: function() {
    return this._defaultFormat;
  }
};

module.exports = User;