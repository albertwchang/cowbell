'use strict';

// REACT PARTSI
var Display = require("react-native-device-display");
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");
var Popover = require('react-native-popover');

// MIXINS
var htmlFilesMixin = require('../Mixins/htmlFiles');
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var Moment = require("moment");
var _ = require("lodash");

var {
	ActionSheetIOS,
	Image,
	NativeModules: {
    RNHTMLtoPDF,
    RNPrint
  },
  PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View
} = React;

var styles = StyleSheet.create({
	main: {
		flexDirection: "column",
		height: Display.height - ViewMixin.getInnerView(),
		width: Display.width - 12
	}, section: {
			marginBottom: 6
		}, header: {
			backgroundColor: ViewMixin.Colors.day.border,
			marginBottom: 4,
			padding: 6
		}, headerText: {
			color: ViewMixin.Colors.night.text,
			fontWeight: "bold"
		}
});

var Invoicing = React.createClass({
	mixins: [IssueMixin, SiteMixin, ViewMixin, htmlFilesMixin],
	propTypes: {
		clientSite: PropTypes.object,
		close: PropTypes.func,
		currentSiteRight: PropTypes.object,
		lookups: PropTypes.object,
		pendingTodoItems: PropTypes.array,
		issue: PropTypes.object,
		sites: PropTypes.object,
		themeColors: PropTypes.array
	},
	_showOrgTypes: false,
	_views: {
		"header": null,
		"options": null,
		"todos": null
	},

	componentWillMount: function() {
		let props = this.props;

		this._buildHeader(props);
		this._buildTodos(props);
		this._setOrgTypeVisibility(props);
	},

	comopnentWillUpdate: function(newProps, newState) {
		let oldProps = this.props;

		if ( !_.eq(newProps.pendingTodoItems, props.pendingTodoItems) )
			this._buildTodos(newProps);

		if ( !_.eq(newProps.currentSiteRight.orgTypeId, props.currentSiteRight.orgTypeId) )
			this._setOrgTypeVisibility(newProps);
	},

	_buildHeader: function(props) {
		// 1. build header: "Invoicing"
		let clientSite = props.clientSite
			, themeColor = props.themeColors[props.currentSiteRight.orgTypeId]
			, propertyTypes = props.lookups.propertyTypes;

		let headerStyles = StyleSheet.create({
			main: {
				flexDirection: "row",
				justifyContent: "center",
				paddingVertical: 2
			}, section: {
					alignSelf: "center"
				}, text: {
						color: this.Colors.day.text,
						fontSize: 19
					},
			closeBtn: {
				color: this.Colors.day.border,
				fontSize: 30
			}
		});

		this._views["header"] =
			<View style={styles.section}>
				<View style={headerStyles.main}>
	      	<View style={ [{flex: 4}, headerStyles.section] }>
		    		<Text style={[{fontWeight: "bold", textAlign: "right"}, headerStyles.text]}>Receipt</Text>
		    	</View>
		    	<View style={ [{flex: 10}, headerStyles.section] }>
			    	<Text style={ [{fontWeight: "200", textAlign: "left"}, headerStyles.text] }> ({propertyTypes[clientSite.propertyTypeId].name} Property)</Text>
		      </View>
	      	<TouchableHighlight
	        	onPress={this.props.close}
	        	style={{flex: 2, alignItems: "center"}}
	        	underlayColor="#A4A4A4">
	        	<Icon name={"close-circled"} style={[headerStyles.closeBtn]} />
	        </TouchableHighlight>
	     	</View>
     	</View>
	},

	_buildTodos: function(props) {
		/* 2. Incomplete todos
				a) title:  "The following action items remain: "
				b) list of remaining todos
				c) message:  "Proceed to build invoice?"
		*/
		let todoStyles = StyleSheet.create({
			main: {
				flexDirection: "column"
			}, item: {
					paddingHorizontal: 6
				}, itemText: {
						color: "#FF0000",
						fontSize: 13,
						letterSpacing: 1
					},
		});

		let pendingTodoItems = props.pendingTodoItems
			, themeColor = props.themeColors[props.currentSiteRight.orgTypeId];
			// , todoText = !_.isEmpty(pendingTodoItems)
			// 	? "There are outstanding action items..."
			// 	: "All action items are done";

 		this._views["todos"] =
  		<View style={ [styles.section, todoStyles.main] }>
				<View style={styles.header}>
 					<Text style={styles.headerText}>Remaining action items</Text>
 				</View>
				{pendingTodoItems.length > 0 ? pendingTodoItems.map((todoItem, index) => (
 					<View
 						key={index}
 						style={todoStyles.item}>
		 				<Text style={todoStyles.itemText}>{index + 1 +". " +props.lookups.todos.items[todoItem.todoId].name}</Text>
		 			</View>
 				)) : <Text>None! You are good to go!</Text>}
 			</View>
	},

	_generateHTML: function(issue, lookups, allSites) {
    let vehicle = issue.vehicle;
    let sites = _.mapValues(issue.sites, (siteRef) => {
      return allSites[siteRef.orgTypeId][siteRef.siteId];
    });

    let colorMap = {
      client: "warning",
      police: "success",
      vendor: "info"
    };

   	function buildEventSection(statusEntry, status) {
  		let eventHTML = "<div class='row'>";
	    		eventHTML += "	<b class='col-xs-5 col-sm-3 col-md-2 text-right'>" +status.names.ui +"</b>";
	    		eventHTML += "	<div class='col-xs-7 col-sm-4 col-md-4 text-center'>" +Moment(statusEntry.timestamp).format('MM/DD/YY @h:mm a') +"</div>";
	    		eventHTML += " 	<i class='col-xs-12 col-sm-5 col-md-6 text-left'>" +(statusEntry.notes || "(No comments)") +"</i>"
	    		eventHTML += "</div>";

	    return eventHTML;
    };
  
    function buildSiteSection(site) {
      let buildTodos = function (todoRef) {
        let todoHTML = "<div class='row'>";
            todoHTML += " <div class='col-xs-4 text-right'><b>" +lookups.orgTypes[site.orgTypeId].todos.options[todoRef.todoId].title +"</b></div>";
            todoHTML += " <div class='col-xs-8'>" +todoRef.value +"</div>";
            todoHTML += "</div>";

        return todoHTML;
      };

      let siteHTML = "  <section class='row card'>";
		      siteHTML += "    <div class='row lead card-header card-" +colorMap[site.orgTypeId] +" p-y-0'>";
		      siteHTML += "      <div class='col-xs-4 col-sm-4 col-md-3 text-right'>" +lookups.orgTypes[site.orgTypeId].name +"</div>";
		      siteHTML += "      <div class='col-xs-8 col-sm-8 col-md-9 text-left'>" +site.name +"</div>";
		      siteHTML += "    </div>";
		      siteHTML += "    <div class='card-block p-t-0'>";
		      siteHTML += "      <small class='col-xs-12 col-sm-12 col-md-5 card-text text-right'>";
		      siteHTML += "        <div class='col-xs-12'>";
		      siteHTML += "          <div class='col-xs-6 col-sm-6 col-md-12 text-right'>" +SiteMixin.buildPrimaryAddyLine(site.address.street) +"</div>";
		      siteHTML += "          <div class='col-xs-6 col-sm-6 col-md-12 text-right'>" +SiteMixin.buildSecondaryAddyLine(site.address) +"</div>";
		      siteHTML += "        </div>";
		      siteHTML += "        <div class='col-xs-12'>";
		      siteHTML += "          <div class='col-xs-4 col-sm-4 col-md-12 text-right'>";
		      siteHTML += "            " +site.phoneNum;
		      siteHTML += "            <i class='fi-telephone'></i>";
		      siteHTML += "          </div>";
		      siteHTML += "          <div class='col-xs-8 col-sm-8 col-md-12 text-right'>";
		      siteHTML += "            <a href='#'>" +site.email +"</a>";
		      siteHTML += "            <i class='fi-mail'></i>";
		      siteHTML += "          </div>";
		      siteHTML += "        </div>";
		      siteHTML += "      </small>";
		      siteHTML += "      <small class='section col-xs-12 col-sm-12 col-md-7'>";

      _.each(issue.sites[site.orgTypeId].todoItems, (todoRef) => {
        siteHTML += buildTodos(todoRef);
      });
      
		      siteHTML += "      </small>";
		      siteHTML += "    </div>";
		      siteHTML += "  </section>";

      return siteHTML;
    };

    function buildVehicleParam(paramRef, paramName, vehicleDef) {
    	let options = vehicleDef.options[paramName].options;
    	let value =  _.isEmpty(paramRef.value) ? "---" : (options ? options[paramRef.value] : paramRef.value);
			
			let paramHTML = "<div class='row'>";
			    paramHTML += "	<span class='col-xs-4 col-sm-5 col-md-5 text-right'><b>" +vehicleDef.options[paramName].title +"</b></span>";
			    paramHTML += "  <span class='col-xs-8 col-sm-7 col-md-7'>" +value +"</span>";
			    paramHTML += "</div>";

	    return paramHTML;
    };

    function buildOwnerSection(approvals, statusDefs, host) {
    	// get status that 1) needs approval and 2) does not have any new statuses
			let approver = "", signatureUri = "";

			if ( !_.isEmpty(approvals) ) {
				let endStatuses = _.filter(statusDefs, (statusDef) => {
					return !_.has(statusDef, "nextStatuses") && statusDef.needsApproval;
				});
				
				_.each(endStatuses, (endStatus) => {
					let approval = approvals[endStatus.iid];
					
					if ( !_.isEmpty(approval) ) {
						approver = approval.approver.name;
						signatureUri = approval.signatureUri;
					}
				});
			}
				
			let ownerHTML = "<!-- VEHICLE OWNER -->";
					ownerHTML += "	<section class='row card-block p-t-md p-b-0'>";
					ownerHTML += "    <div class='col-xs-12 p-a-xs'><b>Vehicle Owner</b>: <i class='lead'>" +approver +"</i></div>";
					ownerHTML += "    <div class='row'>";
					ownerHTML += "      <div class='col-xs-12 col-sm-12 col-md-7 p-t-lg p-r-0'>";
					ownerHTML += "        <small class='col-xs-3 text-left'><b>Signature:</b></small>";
					ownerHTML += _.isEmpty(signatureUri) ? "<hr class='col-xs-11' />" : "        <img class='col-xs-9' src='" +host +signatureUri +"' />";
					ownerHTML += "      </div>";
					ownerHTML += "      <div class='col-xs-12 col-sm-12 col-md-5 p-t-lg p-r-0'>";
					ownerHTML += "        <small class='col-xs-3 text-left'><b>Date:</b></small>";
					ownerHTML += "        <hr class='col-xs-11' />";
					ownerHTML += "      </div>";
					ownerHTML += "    </div>";
					ownerHTML += "  </section>";

			return ownerHTML;
    };

	  let html = "<!DOCTYPE html>";
		    html += "<html class='no-js' lang='en'>";
		    html += "<head>";
		    html += "  <meta charset='utf8'>";
		    html += "  <meta content='width=device-width, height=device-height, initial-scale=1, user-scalable=no'>";
		    html += "  <title>Authorization Invoice</title>";
		    // html += "  <link rel='stylesheet' href='https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/css/bootstrap.min.css'>";
		    html += "  <style>";
		    html += this.getCSS();
		    html += "  </style>";
		    html += "  <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/foundicons/3.0.0/foundation-icons.min.css' type='text/css' />";
		    html += "</head>";
		    html += "<body class='container-fluid'>";
		    html += "  <script src='https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js'></script>";
		    html += "  <script src='https://cdn.rawgit.com/twbs/bootstrap/v4-dev/dist/js/bootstrap.js'></script>";
		    
		    html += "  <!-- Tow Company Info -->";
		    html += "  <section class='row'>";
		    html += "    <div class='col-xs-12 col-sm-6 col-md-6 text-center'>";
		    html += "      <img src='" +lookups.hosts.images.url +sites.vendor.img.logo +"' />";
		    html += "    </div>";
		    html += "    <small class='col-xs-12 col-sm-6 col-md-6 text-right'>";
		    html += "      <div class='row'>";
		    html += "        <span class='col-xs-6 col-sm-12 col-md-12 text-right'>" +SiteMixin.buildPrimaryAddyLine(sites.vendor.address.street) +"</span>";
		    html += "        <span class='col-xs-6 col-sm-12 col-md-12 text-right'>" +SiteMixin.buildSecondaryAddyLine(sites.vendor.address) +"</span>";
		    html += "      </div>";
		    html += "      <div class='row'>";
		    html += "        <span class='col-xs-4 col-xs-text-right col-sm-12 col-md-12 col-md-text-right'>";
		    html += "          " +sites.vendor.phoneNum;
		    html += "          <i class='fi-telephone'></i>";
		    html += "        </span>";
		    html += "        <span class='col-xs-8 col-xs-text-left col-sm-12 col-md-12 col-md-text-right'>";
		    html += "          <a href='#'>" +sites.vendor.email +"</a>";
		    html += "          <i class='fi-mail'></i>";
		    html += "        </span>";
		    html += "      </div>";
		    html += "    </small>";
		    html += "  </section>";
		    
				html += "  <!-- VEHICLE SECTION -->";
		    html += "  <section class='row card-block alert alert-warning alert-dismissible p-y-0'>";
		    html += "    <small class='col-xs-12 col-sm-6 col-md-6'>";
		    
		    _.each(["make", "model", "year", "color"], (paramName) => {
		      html += buildVehicleParam(vehicle[paramName], paramName, lookups.vehicle);
		    });

		    html += "    </small>";
		    html += "    <small class='col-xs-12 col-sm-6 col-md-6'>";
		    
		    _.each(["vin", "licensePlate", "year", "mileage"], (paramName) => {
		      html += buildVehicleParam(vehicle[paramName], paramName, lookups.vehicle);
		    });

		    html += "    </small>";
		    html += "  </section>";
		    html += "";
    
		    _.each(sites, (site) => {
		      html += buildSiteSection(site);
		    });
    
				html += "<!-- EVENT HISTORY -->";
				html += "<section class='row card'>";
				html += "    <!-- Header -->  ";
				html += "    <nav class='row card-header lead text-center p-y-0'>Event History</nav>";
				html += "";
				html += "    <!-- Statuses -->";
				html += "    <small class='card-block p-b-0'>";
			  _.each(issue.statusEntries, (statusEntry) => {
			  	let status = lookups.statuses[statusEntry.statusId];
		      html += buildEventSection(statusEntry, status);
		    });
		    html += "    </small>";
		    html += "  </section>";

		    html += buildOwnerSection(issue.approvals, lookups.statuses, lookups.hosts.images.url);

		    html += "  <div class='row text-left alert alert-warning alert-dismissible text-muted m-b-0 m-t-0 p-t-0 p-b-0'>";
		    html += "    <small>*If you believe that you have been wrongfully towed, please contact the police dept shown above, or the local prosecuting agency</small>";
		    html += "  </div>";
		    html += "  </body>";
		    html += "</html>";

		return html;
	},

	_setOrgTypeVisibility: function(props) {
		this._showOrgTypes = (props.currentSiteRight.orgTypeId === this._orgTypeIds.VENDOR);
	},

	_showDocumentOptions: function(paperType) {
  	let buttons = [
		  "Email",
		  "Print",
		  "Text",
		  'Cancel'
		];

  	ActionSheetIOS.showActionSheetWithOptions({
      options: buttons,
      cancelButtonIndex: 3
    }, (btnIndex) => {
      console.log("you selected: ", btnIndex);
      if (btnIndex === 1) {
      	let props = this.props, state = this.state;
      	let paperTypes = {
      		portable: {
			      height:  960,
			      padding: 12,
			      width: 384
			    },
			    standard: {
			      height: 1056,
			      padding: 32,
			      width: 816
			    }
      	};

      	let options = {
		  		html: this._generateHTML(props.issue, props.lookups, props.sites),
		  		fileName: "issue-" +props.issue.iid,
		  		directory: "docs",
		  		height: paperTypes[paperType].height,
		      padding: paperTypes[paperType].padding,
		      width: paperTypes[paperType].width
		  	};

  			RNHTMLtoPDF.convert(options).then((filepath) => {
		  		console.log(filepath);

		  		RNPrint.print(filepath).then((jobName) => {
		  			consoel.log("Printing ${jobName} complete!");
		  		});
		  	});
      }
    });
  },

	render: function() {
		return (
			<View style={styles.main}>
				{this._views["header"]}
	      {this._views["todos"]}
      	{this._showOrgTypes ?
    		<OrgTypeOptions
    			orgTypeDefs={this.props.lookups.orgTypes}
      		style={styles.section}
      		themeColors={this.props.themeColors} /> : null}
	      <PaperOptions
	      	showDocumentOptions={this._showDocumentOptions}
	      	style={styles.section} />
	    </View>
		);
	}
});

/***************************************************************************************************
*********************************** O R G  T Y P E  O P T I O N  S**********************************
***************************************************************************************************/
var OrgTypeOptions = React.createClass({
	mixins: [SiteMixin, ViewMixin],
	propTypes: {
		orgTypesDefs: PropTypes.object,
		style: PropTypes.number,
		themeColors: PropTypes.array
	},
	_options: null,
	_views: null,
	_styles: StyleSheet.create({
		main: {
			flexDirection: "row",
			justifyContent: "center"
		}, btn: {
				flex: 1
			},
				btnText: {
					fontFamily: "System",
					fontSize: 14,
					flex: 1,
					letterSpacing: 2,
					textAlign: "center"
				},
	}),

	getInitialState: function() {
		return { chosenId: null };
	},
	
	componentWillMount: function() {
		this._options = new Array(
			{
				id: "client",
				img: require("image!client")
			}, {
				id: "vendor",
				img: require("image!vendor")
			}, {
				id: "owner",
				img: require("image!owner")
			}
		);

		this._buildViews(this._options, this.state);
	},

	componentWillUpdate: function(newProps, newState) {
		this._buildViews(this._options, newState);
	},

	_buildViews: function(options, state) {
		this._views = _.map(options, (option) => {
			// Am actually mutating the index value of the array
			option["title"] = this.props.orgTypeDefs[option.id].name;
			return this._buildOption(option, state);
		});
	},

	_buildOption: function(option, state) {
		let themeColor = this.props.themeColors[option.id]
			, dishDims = this._calcBtnSize(Display.width - 12, this._options.length, 0.8)
			, iconStyle = this._calcBtnSize(Display.width - 12, this._options.length, 0.5);

		let dishStyle = {
			alignItems: "center",
			borderColor: themeColor,
			borderWidth: 3,
			borderRadius: dishDims.width,
			justifyContent: "center"
		}; 

		if (option.id === state.chosenId) {
			_.assign(dishStyle, { backgroundColor: themeColor });
			_.assign(iconStyle, { backgroundColor: themeColor });
		}
		
		return (
			<TouchableHighlight
				key={option.id}
	    	onPress={() => this._setOption(option.id)}
	    	style={this._styles.btn}
	    	underlayColor="#FFFFFF">
	    	<View style={{flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
    			<View style={[dishDims, dishStyle]}>
	    			<Image source={option.img} style={iconStyle} />
		    	</View>
		    	<Text style={ [this._styles.btnText, {color: themeColor}] }>{option.title}</Text>
	    	</View>
	    </TouchableHighlight>
	  );
	},

	_calcBtnSize: function(totalWidth, iconCnt, sizeFactor) {
		let width = totalWidth / iconCnt;

		return {
			height: width * sizeFactor,
			width: width * sizeFactor
		};
	},

	_setOption: function(id) {
		this.setState({chosenId: id});
	},

	render: function() {
		return (
			<View style={this.props.style}>
				<View style={styles.header}>
					<Text style={styles.headerText}>Who is this invoice for?</Text>
				</View>
				<View style={this._styles.main}>
					{this._views.map((view) => view)}
			  </View>
			</View>
		);
	}
});


/***************************************************************************************************
************************************ P A P E R   O P T O N S ***************************************
***************************************************************************************************/
var PaperOptions = React.createClass({
	mixins: [SiteMixin, ViewMixin],
	propTypes: {
		showDocumentOptions: PropTypes.func,
		style: PropTypes.number
	},
	_options: null,
	_views: null,
	_styles: StyleSheet.create({
		main: {
			flexDirection: "row",
			justifyContent: "center"
		}, btn: {
				alignItems: "center",
				borderColor: ViewMixin.Colors.day.border,
				borderRadius: 6,
				borderWidth: 0.5,
				flex: 1,
				flexDirection: "column",
				padding: 8
			},
				btnText: {
					fontFamily: "System",
					fontSize: 14,
					flex: 1,
					letterSpacing: 2,
					textAlign: "center"
				},
	}),

	getInitialState: function() {
		return { chosenId: null };
	},
	
	componentWillMount: function() {
		this._options = new Array(
			{
				id: "standard",
				title: "Standard",
				img: require("image!paper-standard")
			}, {
				id: "portable",
				title: "Portable",
				img: require("image!paper-portable")
			}
		);

		this._buildViews(this._options, this.state);
	},

	componentWillUpdate: function(newProps, newState) {
		this._buildViews(this._options, newState);
	},

	_buildViews: function(options, state) {
		this._views = _.map(options, (option) => {
			return this._buildOption(option, state);
		});
	},

	_buildOption: function(option, state) {
		let iconStyle = this._calcBtnSize(Display.width - 12, this._options.length, 0.45)
			, btnMargin = iconStyle.width / 16;
		
		return (
			<TouchableHighlight
				key={option.id}
	    	onPress={() => this.props.showDocumentOptions(option.id)}
	    	style={ [this._styles.btn, {margin: btnMargin}] }
	    	underlayColor={this.Colors.day.section}>
	    	<View style={{flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
	    		<Image source={option.img} style={iconStyle} />
		    	<Text style={ [this._styles.btnText, {color: this.Colors.day.text}] }>{option.title}</Text>
	    	</View>
	    </TouchableHighlight>
	  );
	},

	_calcBtnSize: function(totalWidth, iconCnt, sizeFactor) {
		let width = totalWidth / iconCnt;

		return {
			height: width * sizeFactor,
			width: width * sizeFactor
		};
	},

	_setOption: function(id) {
		this.setState({chosenId: id});
	},

	render: function() {
		return (
			<View style={this.props.style}>
				<View style={styles.header}>
					<Text style={styles.headerText}>Choose printing paper</Text>
				</View>
				<View style={ [this.props.style, this._styles.main] }>
					{this._views.map((view) => view)}
			  </View>
			</View>
			
		);
	}
});

module.exports = Invoicing;