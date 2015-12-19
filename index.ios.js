'use strict';

var Display = require('react-native-device-display');
var Icon = require("react-native-vector-icons/Ionicons");
var Orientation = require("react-native-orientation");
var React = require('react-native');
var Reflux = require("reflux");

// CONTEXTS
var Auth = require("./_Auth/AuthMain");
// var NewIssue = require("./_NewIssue/NIMain");
var IssueList = require("./_IssueList/ILMain");
var Settings = require("./_Settings/SMain");
var UserProfile = require("./_UserProfile/UPMain");

// MIXINS
var IssueMixin = require("./Mixins/Issue");
var SiteMixin = require("./Mixins/Site");
var ViewMixin = require("./Mixins/View");

// ACTIONS && STORES
var HostStore = require("./Stores/HostStore");
var HostActions = require("./Actions/HostActions");

var LookupActions = require("./Actions/LookupActions");
var LookupStore = require("./Stores/LookupStore");

var LocationStore = require("./Stores/LocationStore");
var LocationActions = require("./Actions/LocationActions");

var ProfileStore = require("./Stores/ProfileStore");
var ProfileActions = require("./Actions/ProfileActions");

var SiteStore = require("./Stores/SiteStore");
var SiteActions = require("./Actions/SiteActions");

var UserActions = require("./Actions/UserActions");
var UserStore = require("./Stores/UserStore");

// Utilities
var Async = require("async");
var Moment = require("moment");
var _ = require("lodash");

var {
  ActivityIndicatorIOS,
  AppRegistry,
  Navigator,
  StatusBarIOS,
  StyleSheet,
  TabBarIOS,
  Text,
  View,
} = React;

var styles = StyleSheet.create({
  main: {
    backgroundColor: ViewMixin.Colors.night.background,
    flex: 1
  },
  navBar: {
    backgroundColor: "#DF7401"
  },
  loading: {
    flex: 1,
    alignSelf: 'center',
  },
  text: {
    color: "#FFFFFF"
  }
});

var CowBell = React.createClass({
  _chosenTab: "issues",
  _gotLookups: false,
  mixins: [Reflux.connect(HostStore), Reflux.connect(LocationStore), Reflux.connect(LookupStore)
        , Reflux.connect(ProfileStore), Reflux.connect(SiteStore), Reflux.connect(UserStore)
        , Reflux.ListenerMixin, IssueMixin, SiteMixin, ViewMixin],
  _contexts: {
    "issues": {
      icon: "ios-glasses-outline",
      comp: IssueList
    },
    // "new": {
    //   icon: "ios-compose",
    //   comp: NewIssue
    // },
    "profile": {
      icon: "ios-person",
      comp: UserProfile
    },
    "settings": {
      icon: "ios-settings",
      comp: Settings
    }
  },

  getInitialState: function() {
    return {
      inProgress: true,
      initDone: false
    }
  },

  componentWillMount: function() {
    StatusBarIOS.setStyle("light-content");
    Moment.locale('en', {
      relativeTime : {
        future: "in %s",
        past:  "%s ago",
        s:  "< a min",
        m:  "1 min",
        mm: "%d min",
        h:  "1 hr",
        hh: "%d hrs",
        d:  "1 day",
        dd: "%d days",
        M:  "1 month",
        MM: "%d months",
        y:  "1 yr",
        yy: "%d yrs"
      }
    });
    Orientation.lockToPortrait();

    // 1. Get Current User Data (which also validates whether user is authenticated)
    let qProfile = ProfileActions.getLocalAuth.triggerPromise().then((authData) => {      
      return ProfileActions.setCurrentUser.triggerPromise(authData).then(() => {
        
        // Initialize a variety of things for validated user
        return this._initSession();
      });
    }).catch(() => {
      console.log("$@@$$@$@$@$@ No Auth Data...");
      return;
    });

    // 3. retrieve references to "lookup"
    let qLookups = this._getLookups();

    new Promise.all([qProfile, qLookups]).then((results) => {
      this._gotLookups = true;
    }).finally(() => {
      this.setState({ inProgress: false });
    });
  },

  componentWillUpdate: function(newProps, newState) {
    let oldState = this.state;

    if ( !_.isEmpty(oldState.currentUser) && _.isEmpty(newState.currentUser) ) {
      // user either logged in, or resumed usage of app while previously logged-in
      this._chosenTab = "issues";
      this._gotLookups = false;
      this.setState({
        inProgress: false,
        initDone: false,
      });
    }
  },

  _buildTabBarItem: function(tabName) {
    let isChosen = (this._chosenTab === tabName);
    
    return (
      <Icon.TabBarItem
        iconName={this._contexts[tabName].icon}
        key={tabName}
        onPress={() => this._setTab(tabName)}
        selected={isChosen}
        title={tabName}>
        {isChosen ? this._routeContext(tabName) : ""}
      </Icon.TabBarItem>
    );
  },

  _getLookups: function() {
    // 3. retrieve references to "lookup"
    return LookupActions.validateLookups.triggerPromise().then((lookups) => {
      
      // 3a. Get policy for being allowed to upload images
      let imgPolicy = lookups.hosts["img"].policy;
      return HostActions.pullS3Policy.triggerPromise(imgPolicy);
    });
  },

  _initSession: function() {
    // 1a. Setup GeoWatcher
    LocationActions.setPositionStream();
    let state = this.state;
    let currentUser = state.currentUser
      , siteRight = state.currentSiteRight;
    
    // 2 Establish current/target site
    let qSite = SiteActions.pullEmployerSite.triggerPromise(siteRight.siteId).then((site) => {
        // get users for retrieved employer site
        let users = site.users
          , userIds = _.chain(users).where({isActive: true}).pluck("id").value();

        return _.isEmpty(userIds) ? new Promise.resolve() : UserActions.pullUsers(site.iid, userIds);
      }).catch((err) => {
        console.log("Overall Error:  couldn't get a lot of dependencies: ", err);
        return;
      }).finally(() => {
        this.setState({ initDone: true });
        return;
      });

    let qLookups = this._gotLookups ? new Promise.resolve() : this._getLookups();
    return new Promise.all([qSite, qLookups]);
  },

  _routeContext: function(tab) {
    let state = this.state
      , Context = this._contexts[tab].comp;

    return (
      <Context
        currentSiteRight={state.currentSiteRight}
        currentUser={state.currentUser}
        host={state.host}
        lookups={state.lookups}
        sites={state.sites}
        themeColor="#DF7401" />
    );
  },

  _setProgress: function(state) {
    this.setState({ inProgress: state })
  },

  _setTab: function(tab) {
    this._chosenTab = tab;
    this.setState({
      notifCount: this.state.notifCount + 1,
    });
  },

  render: function() {
    let state = this.state;

    /************************************************************************************
     Three (4) Different Scenarios to consider (based on various states):
      1) Application IS checking whether previous session persists
      2) Application DONE checking existence of previous session
        A. session exists and therefore current user profile exists
        B. no session data exists, and therefore app redirects user to login/register
        C. user logged out (previous user profile existed, but now does not exist)
    *************************************************************************************/

    // App is determining whether user's sessin if active
    if (state.inProgress)
      return (
        <ActivityIndicatorIOS
          animating={state.inProgress}
          style={styles.loading}
          size="large" />
      );

    // No user session found; have user login or register
    else if ( _.isEmpty(state.currentUser) )
      return (
        <Auth
          host={state.host}
          lookups={state.lookups}
          initSession={this._initSession}
          setProgress={this._setProgress}
          style={styles.main} />
      );

    // user session exists
    else {
      let tabs = _.keys(this._contexts);

      return (
        <TabBarIOS
          barTintColor="#2E2E2E"
          style={styles.main}
          tintColor="#FE9A2E"
          translucent={false}>{
            _.map(tabs, (tabName) => {
              return this._buildTabBarItem(tabName);
            })
          }
        </TabBarIOS>
      );
    }
  }
});

AppRegistry.registerComponent('CowBell', () => CowBell);
