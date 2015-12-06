'use strict';

// REACT PARTS
var Carousel = require('react-native-carousel');
var Collapsible = require('react-native-collapsible/Collapsible');
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");
// var Signature = require('react-native-signature-capture');

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");
var MenuSelect = require("../Comps/MenuSelect");
var Site = require("../Comps/Site");
var User = require("../Comps/User");

// ACTIONS && STORES
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");
var UserStore = require("../Stores/UserStore");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// Utilities
var Async = require("async");
var _ = require("lodash");

var {
	Image,
	ListView,
	Modal,
	PropTypes,
	StyleSheet,
	Text,
	TextInput,
	TouchableHighlight,
	View
} = React;

var Approver = React.createClass({
	propTypes: {
		chosenStatus: PropTypes.object,
		imgHost: PropTypes.object,
		needsApproval: PropTypes.bool,
		oldApproval: PropTypes.object,
		setApproval: PropTypes.func,
		setApprovalProperty: PropTypes.func,
		siteRight: PropTypes.object,
		sites: PropTypes.object,
		themeColors: PropTypes.array,
		users: PropTypes.array
	},
	mixins: [Reflux.ListenerMixin, Reflux.connect(UserStore), IssueMixin, SiteMixin, ViewMixin],
	_styles: StyleSheet.create({
		section: {
			flex: 1,
			flexDirection: "row",
			width: Display.width
		}, changeApproverBtn: {
				flex: 1,
				justifyContent: "center",
			},
			selectApproverBtn: {
				borderColor: "#FFFFFF",
				borderRadius: 4,
				borderWidth: 0.5,
				flex: 1,
				height: ViewMixin.Dimensions.ACTION_BTN_HEIGHT,
				justifyContent: "center",
				paddingVertical: 6
			}, sabText: {
					color: "#000000",
					fontFamily: "System",
					fontWeight: "200",
					fontSize: 34,
					textAlign: "center"
				},
			approverName: {
				borderRadius: 4,
				borderWidth: 0.75,
				color: "#FFFFFF",
				fontFamily: "System",
				fontSize: 24,
				fontWeight: "200",
				height: 50,
				justifyContent: "center",
				letterSpacing: 2,
				paddingHorizontal: 12,
				width: Display.width - 20
			}
	}),

	getInitialState: function() {
		return {
			approvers: null,
			approverMenu: false,
			approverSites: null,
			chosenIndex: 0,
			dims: null,
			ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid})
		};
	},

	componentWillMount: function() {
		this._refreshData(this.props);
	},

	componentWillReceiveProps: function(newProps) {
		var oldProps = this.props;

		if ( !_.eq(newProps.chosenStatus, oldProps.chosenStatus) && newProps.chosenStatus)
			this._refreshData(newProps);
	},

	_changeApproverType: function(page) {
		this.state.chosenIndex = page;

		if (!this.state.approvers[page])
			return;
		else
			this.props.setApprovalProperty({approver: this.state.approvers[page]}, "fresh");

		this.setState(this.state);
	},

	_getApproverSites: function(orgTypes) {
		// it is assumed that imcumbent site is allowed to approve
		var sites = this.props.sites;
		var approverSites = [];

		_.each(orgTypes, (orgType) => {
			if (!sites[orgType])
				return;

			approverSites.push(sites[orgType]);
		});

		return approverSites;
	},

	_hasApproverSites: function() {
		return this.state.approverSites.length > 0;
	},

	_refreshApproverOrgTypes: function(status) {
		var approverOrgTypes = [];
			
		_.each(status.accessRights.approve, (value, key) => {
			if (value === true)
				approverOrgTypes.push(key);
		});

		return approverOrgTypes;
	},

	_refreshData: function(props) {
		var approverOrgTypes = this._refreshApproverOrgTypes(props.chosenStatus);
		var approverSites = this._getApproverSites(approverOrgTypes);
		var siteWithUsers = _.find(approverSites, (site) => {
			return _.has(site, "users");
		});

		this.setState({
			approvers: new Array(approverSites.length),
			approverSites: approverSites,
			chosenIndex: 0,
			users: siteWithUsers ? this._refreshUsers(siteWithUsers.users, siteWithUsers.orgTypeId) : undefined
		});
	},

	_refreshUsers: function(userRefs, orgType) {
		// current user needs to select an approving user from client site
		var activeUserIds = _.chain(userRefs).where({"isActive": true}).pluck("id").value();
		var users = new Array(activeUserIds.length);
		
		_.each(activeUserIds, (userId) => {
			users[userId] = this.props.users["site"][orgType][userId];
		});

		return users;
	},

	_renderApprover: function(site, index) {
		var approverIndex = this._hasApproverSites() ? index : this.state.chosenIndex;
		var freshApprover = this.state.approvers[approverIndex];
		var dims = this.state.dims;
		var oldApprover = this.props.oldApproval ? this.props.oldApproval.approver : undefined;
		var siteRight = this.props.siteRight;
		var themeColors = this.props.themeColors;
		var Approver, ApproverSite;

		ApproverSite = (site && this.props.chosenStatus.accessRights.approve[site.orgTypeId]) ?
			<Site
				info={site}
				imgHost={this.props.imgHost}
				showImg={true}
				style={this._styles.section} /> : null;

		if (oldApprover && _.has(oldApprover, "siteId") && _.has(oldApprover, "orgTypeId")) {
			Approver =
				<View style={ [this._styles.changeApproverBtn, {backgroundColor: themeColors[site.orgTypeId], width: dims ? dims.width : 0}] }>
					<User
						employerSite={site}
						imgHost={this.props.imgHost}
						info={this.state.users[oldApprover.id]}
						themeColor={themeColors[site.orgTypeId]} />
				</View>
		} else if (_.has(site, "users")) {
			var ApproverState;

			if (freshApprover && freshApprover["id"]) {
				ApproverState =
					<View style={ [this._styles.changeApproverBtn, {width: dims ? dims.width : 0}] }>
						<User
							employerSite={site}
							imgHost={this.props.imgHost}
							info={this.state.users[freshApprover.id]}
							themeColor={themeColors[site.orgTypeId]} />
					</View>

			} else
				ApproverState =
					<View style={ [this._styles.selectApproverBtn, {backgroundColor: themeColors[site.orgTypeId], width: dims ? dims.width : 0}] }>
						<Text style={this._styles.sabText}>Select An Approver</Text>
					</View>

			Approver =
				<TouchableHighlight
					onPress={() => this._toggleMenu(true)}
					style={{flex: 1}}>
					{ApproverState}
				</TouchableHighlight>
		} else
			Approver =
				<TextInput
					onChangeText={(value) => this._setApprover(value, "name", site)}
					defaultName="Please enter name"
					style={[this._styles.approverName, {borderColor: themeColors[site ? site.orgTypeId : "security"], width: dims ? dims.width - 1 : 0}]}
					value={freshApprover ? freshApprover["name"] : ""} />

		return (
			<View key={index}>
				{ApproverSite}
				<LineSeparator height={0} horizMargin={0} vertMargin={2} />
				{Approver}
			</View>
		);
	},

	_renderSite: function(site, sectionId, rowId) {
		return (
			<Site
				info={site}
				imgHost={this.props.imgHost}
				showImg={true}
				style={_styles.site} />
		);
	},

	_renderUser: function(user, sectionId, rowId, onIcon, offIcon) {
		var freshApprover = this.state.approvers[this.state.chosenIndex];
		var site = this.state.approverSites[this.state.chosenIndex];
		var userThemeColor = freshApprover && (user.iid === freshApprover.id) ? this.Styles._textStyle.on.color : this.props.themeColors[site.orgTypeId];
		
		return (
			<User
				employerSite={site}
				imgHost={this.props.imgHost}
				info={user}
				setValue={(userId) => this._setApprover(userId, "id", site)}
				themeColor={userThemeColor} />
		);
	},

	_setDims: function(e) {
		if (this.state.dims === null) {
			var layout = e.nativeEvent.layout; 
			
			this.setState({
				dims: {
					height: layout.height,
					width: layout.width,
				}
			});
		} else
			return;
  },

  _setApprover: function(approverId, param, site) {
  	var chosenIndex = this.state.chosenIndex;
  	var freshApprovers = this.state.approvers;

  	freshApprovers[chosenIndex] = !site ? {} : this.prepApprover(site);
  	freshApprovers[chosenIndex][param] = approverId;
  	
  	this.props.setApproval(freshApprovers[chosenIndex], "fresh", this.props.chosenStatus.iid);
  	this._toggleMenu(false);
  },

	_toggleMenu: function(state, approverSitesIndex) {
		this.state.approverMenu = state;
		this.setState(this.state);
	},

	render: function() {
		var freshApprover = this.state.approvers[this.state.chosenIndex];
		var dims = this.state.dims;
		var oldApproval = this.props.oldApproval;
		var siteRight = this.props.siteRight;
		var themeColors = this.props.themeColors;
		var Approvers;

		// SCENARIO 1: anytime an approval is NOT needed, there is no need at all to present any approval stuff
		if (!this.props.needsApproval)
			return null;

		// SCENARIO 2: Having an approval already given means no approval is necessary 
		else if (this.props.oldApproval) {
			var approverSite = this.props.sites[oldApproval.approver.orgTypeId];
			Approvers = this._renderApprover(approverSite);
		}

		// SCENARIO 3: Approval needed by Client, Security, or the actual vehicle Owner
		else {
			if (this._hasApproverSites())
				Approvers =
					<Carousel
						hideIndicators={true}
						indicatorColor="#FF0000" // Active indicator color
						onPageChange={this._changeApproverType}
						width={dims ? dims.width : 0}>{
						_.map(this.state.approverSites, (site, index) => {
							return this._renderApprover(site, index);
						})
					}
					</Carousel>
			else
				Approvers = this._renderApprover();
		}

		return (
			<View onLayout={this._setDims}>
				<Modal
					animation={false}
					visible={this.state.approverMenu}>
					<MenuSelect
						choice={freshApprover ? freshApprover.id : null}
						ds={this.state.ds}
						options={this.state.users}
						renderRow={this._renderUser}
						style={this._styles.approverMenu}>
					</MenuSelect>
				</Modal>
				{Approvers}
			</View>
		);
	}
});

module.exports = Approver;