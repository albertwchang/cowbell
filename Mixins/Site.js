var _ = require("lodash");

var Site = {
	_orgTypeIds: {
		CLIENT: "client",
		OWNER: "owner",
		POLICE: "police",
		SECURITY: "security",
		VENDOR: "vendor"
	},
 	buildPrimaryAddyLine: function(street) {
    let addyLine = street.number
                  +( _.isEmpty(street.name) ? "" : " " +street.name)
                  +( _.isEmpty(street.type) ? "" : " " +street.type)
                  +( _.isEmpty(street.unit) ? "" : ", " +street.unit);

    return addyLine;
  },

  buildSecondaryAddyLine: function(addy) {
    let addyLine = ( _.isEmpty(addy.city) ? "" : addy.city)
                  +( _.isEmpty(addy.state) ? "" : ", " +addy.state)
                  +( _.isEmpty(addy.zip.primary) ? "" : "  " +addy.zip.primary)
                  +( _.isEmpty(addy.zip.ext) ? "" : "-" +addy.zip.ext);

    return addyLine;
  },

	_getAllyOrgTypeId: function(orgTypeId) {
		return (orgTypeId === "vendor") ? "client" : "vendor";
	},

	getSiteIdsByOrgType: function(siteRefs, orgType) {
		return _.chain(siteRefs).where({"isActive": true, "orgTypeId": orgType}).pluck("id").value();
	}
};

module.exports = Site;