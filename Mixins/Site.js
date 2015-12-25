var _ = require("lodash");

var Site = {
 	buildPrimaryAddyLine: function(street) {
    let addyLine = street.number
      +( _.isEmpty(street.name) ? "" : " " +street.name)
      +( _.isEmpty(street.type) ? "" : " " +street.type)
      +( _.isEmpty(street.unit) ? "" : ", " +street.unit);

    return addyLine;
  },

  buildSecondaryAddyLine: function(addy) {
    let addyLine = ( _.isEmpty(addy.city) ? "" : addy.city)
      +( _.isEmpty(addy.state) ? "" : ", " +addy.state) +" " +this._processZip(addy.zip);

    return addyLine.trim();
  },

	getSiteIdsByOrgType: function(siteRefs, orgType) {
		return _.chain(siteRefs).where({"isActive": true, "orgTypeId": orgType}).pluck("id").value();
	},

  _processZip: function(zip) {
    let { primary, ext } = zip;
    primary = (_.isNumber(primary) && primary > 0) ? primary.toString() : "";
    ext = (_.isNumber(ext) && ext > 0) ? "-" +ext.toString() : "";
    
    return _.isEmpty(primary) ? "" : primary +ext;
  }
};

module.exports = Site;