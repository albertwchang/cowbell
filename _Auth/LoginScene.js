'use strict';

var Accordion = require("react-native-collapsible/Accordion");
var Display = require("react-native-device-display");
var React = require("react-native");
var Icon = require("react-native-vector-icons/Ionicons");
var Refresh = require("react-native-refreshable-listview");

// ACTIONS && HOSTS
var LookupActions = require("../Actions/LookupActions");
var ProfileActions = require("../Actions/ProfileActions");

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// UTILS
var _ = require("lodash");

var {
	Image,
	ListView,
	PropTypes,
	StatusBarIOS,
	StyleSheet,
	Text,
	TextInput,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	main: {
		flexDirection: "column",
		height: Display.height,
		position: "absolute",
		top: ViewMixin.Dimensions.STATUS_BAR_HEIGHT,
		width: Display.width
	}, envText: {
			color: "#FFFFFF",
			fontFamily: "System",
			fontSize: 24,
			letterSpacing: 2,
			textAlign: "center"
		},
		sitesBox: {
			flex: 4,
		}, siteBox: {
				flexDirection: "row",
				margin: 6
			}, siteImgBox: {
					flex: 1,
				}, siteImg: {
						borderRadius: 4,
						flex: 1,
						justifyContent: "center"
					}, 
				siteTextBox: {
					flex: 5,
					justifyContent: "center",
					padding: 6
				}, siteText: {
						color: "#FFFFFF",
						fontSize: 24,
						fontWeight: "200",
						justifyContent: "center",
						textAlign: "left"
					},
		usersBox: {
			justifyContent: "center",
			flexDirection: "row",
			flexWrap: "wrap"
		}, userBox: {
				borderWidth: 0.75,
				margin: 6,
				width: (Display.width - 3 * 12) / 3
			}, userImg: {
				resizeMode: "cover",
				height: (Display.width - 3 * 12) / 3
			}, userTextBox: {
				padding: 2
			}, userText: {
					color: "#000000",
					fontSize: 22,
					fontWeight: "200",
					textAlign: "center"
				},
			alliesBox: {

			}
});

var LoginScene = React.createClass({
	mixins: [SiteMixin, ViewMixin],
	propTypes: {
		// db: PropTypes.object,
		// env: PropTypes.string,
		host: PropTypes.object,
		lookups: PropTypes.object,
		initSession: PropTypes.func,
		setProgress: PropTypes.func
	},
	_ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),
	_sites: null,
	_users: null,
	getInitialState: function() {
		return {
			chosenSite: null,
			dataLoaded: false,
			siteId: null,
			userId: null
		}
	},

	componentWillMount: function() {
		let qSites = this._reloadTable("sites")
			, qUsers = this._reloadTable("users");

		Promise.all([qUsers, qSites]).then((results) => {
			_.each(results, (table) => {
				let tableData = table.data
					, tableName = table.key;
				
				if (tableName === "users")
					this._users = tableData;
				else {
					let lookups = this.props.lookups
						, imgHostUrl = lookups.hosts.img.provider.url
						, activeSites = _.where(tableData, {"isActive": true});

					this._sites = {
						accordion: this._resetAccordion( _.keys(activeSites) ),
						data: _.map(activeSites, (site, siteId) => {
							return this._buildSiteSection(site, imgHostUrl)
						})
					};
				}
			});

			return;
		}).then(() => {
			this.setState({ dataLoaded: true });
		}).catch((err) => {
			console.log(err);
		});
	},

	componentWillUnmount: function() {
		console.log("Login Scene unmounted");
	},

	_buildSiteSection: function(site, imgHostUrl) {
		let siteSection = {};
		let userIds = _.chain(site.users).where({"isActive": true}).pluck("id").value();
		let siteUsers = _.map(userIds, (userId) => {
			return this._users[userId]
		});

		let userDims = {
			height: (Display.width - 3 * 12) / 3,
			width: (Display.width - 3 * 12) / 3
		};

		siteSection["header"] =
			<View key={site.iid} style={styles.siteBox}>
				<View style={styles.siteImgBox}>
					<Image
						source={{ uri: imgHostUrl +site.img.icon +"?fit=crop&w=49&h=49"}}
						style={{height: 49, width: 49}} />
				</View>
				<View style={styles.siteTextBox}>
					<Text numberOfLines={1} style={styles.siteText}>{site.name}</Text>
				</View>
			</View>

		siteSection["content"] =
			<View style={styles.usersBox}>{
				siteUsers.map((user) => (
					<TouchableHighlight
						key={user.iid}
						onPress={() => this._handleLogin(user.email)}>
						<View style={ [styles.userBox, {borderColor: "#A4A4A4"}] }>
							<Image
								source={{uri: imgHostUrl +user.uri.selfie +"?fit=crop&w=" +userDims.width +"&h=" +userDims.height}}
								style={styles.userImg} />
							<View style={ [styles.userTextBox, {backgroundColor: "#A4A4A4"}] }>
								<Text style={styles.userText}>{user.name.first}</Text>
							</View>
						</View>
					</TouchableHighlight>
				))
			}
			</View>

		siteSection["siteId"] = site.iid;
		return siteSection;
	},

	_handleLogin: function(email) {
		let props = this.props;
		let creds = {
			email: email,
			password: "test"
		};
		
		props.setProgress(true);
		props.host.db.authWithPassword(creds, (err, authData) => {
			if (authData) {
				ProfileActions.setCurrentUser.triggerPromise(authData).then(() => {
					return props.initSession();
	      }).then(() => {
	      	props.setProgress(false);
	      }).catch((err) => {
	        // err doesn't necessarily mean user wasn't logged in.  Look at using AsyncStorage for user
	      	console.log("Something went wrong: ", err);  
	      });
			}
			else
				console.log("Error logging in...");
		});
	},

	_reloadTable: function(table) {
		let tableRef = this.props.host.db.child(table);
		
		return new Promise((resolve, reject) => {
			tableRef.once("value", (tableData) => {
				resolve({
					key: tableData.key(),
					data: tableData.val()
				});
			});
		});
	},

	_renderContent: function(section) {
		return section.content;
	},

	_renderHeader: function(section) {
		return section.header;
	},

	_renderSeparator: function(section, issueId) {
		return ( <LineSeparator color="#01A9DB" height={0.75} vertMargin={20} /> );
	},

	_renderSites: function(sites, sectionId, rowId) {
		return (
			<Accordion
				key={rowId}
				onChange={(index) => this._updateAccordion(index, sites)}
				renderHeader={this._renderHeader}
				renderContent={this._renderContent}
				sections={sites.data} />
		);
	},

	_resetAccordion: function(obj) {
		return _.transform(obj, (result, value, key, remaining) => {
			if (typeof value == "object")
				result[value] = this._resetAccordion(value);
			else
				result[value] = false;
		});
	},

	_updateAccordion: function(index, sites) {
		var siteIds = _.pluck(sites.data, "siteId");
		var pressedSiteId = siteIds[index];
		var pressedValue = sites.accordion[pressedSiteId];
		
		this._sites.accordion = this._resetAccordion(siteIds);
		this._sites.accordion[pressedSiteId] = !pressedValue;
		this.setState({ chosenSiteId: pressedSiteId });
	},

	render: function() {
		let Content = this.state.dataLoaded
			? <Refresh
	        dataSource={this._ds.cloneWithRows([this._sites])}
	        removeClippedSubviews={true}
	        renderRow={this._renderSites}
	        style={styles.sitesBox}
					loadData={() => this._reloadTable("sites")} />
			: <View style={styles.sitesBox}>
					<Text>Getting Data...</Text>
				</View>

		return (
			<View style={styles.main}>
				<View>
					<Text style={styles.envText}>{this.props.host.env.toUpperCase()}</Text>
				</View>
				<LineSeparator height={0.5} horzMargin={0} vertMargin={4} />
				{Content}
			</View>
		);
	}
})

module.exports = LoginScene;