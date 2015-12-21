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
    let name = "";
    format = _.isEmpty(format) ? this._defaultFormat : format;

    _.each(nameObj, function(value, key) {
      if ( _.isEmpty(value) )
        return;
      else
        name += (format[key].initial ? value.charAt(0) +". " : value +" ");
    });

    return name.trim();
  },
  getFormat: function() {
    return this._defaultFormat;
  }
};

module.exports = User;