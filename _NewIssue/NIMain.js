'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var NavBar = require("react-native-navbar");
var React = require("react-native");
var Reflux = require("reflux");
var TimerMixin = require('react-timer-mixin');

// COMPONENTS
var CallScene = require("./CallScene");
var FormScene = require("./FormScene");
var ImagesMgr = require("./ImagesMgr");
var Site = require("../Comps/Site");
var WhenMgr = require("../Comps/WhenMgr");
var WhereMgr = require("../Comps/WhereMgr");

// COMPONENTS
var NavBar = require("react-native-navbar");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES

// Utilities
var Moment = require("moment");
// var precomputeStyle = require('precomputeStyle');
var _ = require("lodash");

var {
  Modal,
  Navigator,
  PropTypes,
  // ListView,
  SegmentedControlIOS,
  StatusBarIOS,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = React;

var Styles = StyleSheet.create({
  navBarTitle: {
    alignItems: "center",
    alignSelf: "center",
    flex: 8,
    justifyContent: "center",
    width: (Display.width * 2) / 4,
  },
  main: {
    flex: 1,
    flexDirection: "column"
  },
  body: {
    height: Display.height - ViewMixin.Dimensions.STATUS_BAR_HEIGHT - ViewMixin.Dimensions.NAV_BAR_HEIGHT - ViewMixin.Dimensions.TAB_BAR_HEIGHT,
    justifyContent: "center"
  },
  
  sectionContent: {
    paddingHorizontal: 4,
    paddingVertical: 4
  }, contentText: {
    color: "#848484",
    fontFamily: "System",
    fontSize: 22,
    fontWeight: "200",
    paddingHorizontal: 8,
    textAlign: "center"
  }
})

var NRMain = React.createClass({
  mixins: [Reflux.ListenerMixin, IssueMixin, SiteMixin, ViewMixin],
  propTypes: {
    currentSiteRight: PropTypes.object,
    currentUser: PropTypes.object,
    db: PropTypes.object,
    lookups: PropTypes.object,
    sites: PropTypes.object,
    themeColors: PropTypes.array
  },
  _childRef: null,
  _defaultView: null,
  _imgTypeId: null,
  _siteIds: null,
  _submitStatuses: null,
  _todoSets: null,
  _views: [],

  getInitialState: function() {
    return this._refreshState();
  },

  componentWillMount: function() {
    StatusBarIOS.setHidden(false);
    StatusBarIOS.setStyle("light-content");
    this._defaultView = <Text style={Styles.contentText}>--- Please Select ---</Text>;
    this._refreshSites(this.props, this.state);
    this._refreshWhere(this.props, this.state);
    this._refreshWhen(this.props, this.state);
    this._refreshImages(this.props, this.state);
    this._refreshTodos(this.props, this.state);
  },

  componentWillUpdate: function(newProps, newState) {
    var oldState = this.state

    if ( !_.eq(newProps, this.props) ) {
      this._refreshWhere(newProps, newState);
      this._refreshWhen(newProps, newState);
      this._refreshImages(newProps, newState);
      this._refreshSites(newProps, newState);
      this._refreshTodos(newProps, newState);      
    } else {
      if ( !_.eq(oldState.sections.where.value, newState.sections.where.value) ) {
        this._refreshWhere(newProps, newState);
        this._refreshSites(newProps, newState);
      }
      if ( !_.eq(oldState.sections.when.value, newState.sections.when.value) )
        this._refreshWhen(newProps, newState);
      if ( !_.eq(oldState.sections.images.value, newState.sections.images.value) )
        this._refreshImages(newProps, newState);
      if ( !_.eq(oldState.sections.todos.value, newState.sections.todos.value) )
        this._refreshTodos(newProps, newState);
    }
  },

  _changeScene: function(e) {
    var newSceneIndex = e.nativeEvent.selectedSegmentIndex;
    if (this.state.sceneIndex != newSceneIndex)
      this.setState({
        sceneIndex: newSceneIndex,
      });
  },

  _openImagesModal: function(imgTypeId, modalState, section) {
    this._imgTypeId = imgTypeId;
    this._toggleModal(modalState, section);
  },

  _moveInput: function(targetRef, offset) {
    let scrollResponder = this._childRef.getScrollResponder();
    let nodeHandle = React.findNodeHandle(targetRef);
    scrollResponder.scrollResponderScrollNativeHandleToKeyboard(nodeHandle, offset);
  },

  _refreshImages: function(props, state) {
    var currentSiteRight = props.currentSiteRight
      , imgTypes = props.lookups.imgTypes
      , imgSection = state.sections.images
      , doneState = imgSection.done ? "on" : "off";

    if (!imgSection.value) {
      imgSection.value = {
        "licensePlate": null,
        "vehicle": null
      };
    }

    this._views["images"] =
      <ImagesMgr
        images={imgSection.value}
        lookups={props.lookups}
        setImages={(newImages, newState) => this._setSectionValue("images", newImages, [], newState)}
        style={Styles.sectionContent} />
  },

  _refreshSites: function(newProps, newState) {
    var currentSiteRight = newProps.currentSiteRight
      , currentUser = newProps.currentUser
      , lookups = newProps.lookups
      , imgHost = lookups.hosts["images"]
      , sections = newState.sections
      , sites = newProps.sites;

    if ( !_.eq(sections.where.value, this.state.sections.where.value) || _.isEmpty(this.state.sections.where.value)) {
      var clientSite = sections.where.value || (currentSiteRight.orgTypeId === this._orgTypeIds.CLIENT ? sites[this._orgTypeIds.CLIENT][currentSiteRight.siteId] : null);
      
      if (!clientSite) {
        this._siteIds = {
          client: null,
          police: null,
          vendor: currentSiteRight.siteId
        };
      } else {
        // clientId is preselected for client users vs. being chosen at a later point for tow users
        this._siteIds = _.chain(clientSite.allies).mapValues((sites) => {
          return _.findWhere(sites, {"isActive": true}).id;
        }).assign({"client": clientSite.iid}).value();
      }
    }
    
    // Get all applicable statusRefs that can be used for submitting tow issue:
    if ( _.eq(currentSiteRight, this.props.currentSiteRight) )
      this._submitStatuses = this.getSubmitStatuses(lookups.statuses, currentSiteRight);
  },

  _refreshState: function() {
    this._todoSets = null, this._views = [];

    return {
      sceneIndex: 0,
      sections: {
        where: {
          done: false,
          icon: "ios-location",
          name: "where",
          showModal: false,
          title: "Where is vehicle parked...",
          value: null
        },
        when: {
          done: false,
          icon: "ios-calendar-outline",
          name: "when",
          showModal: false,
          title: "When first observed...",
          value: null
        }, 
        images: {
          done: false,
          icon: "android-car",
          name: "images",
          showModal: false,
          title: "What does it look like...",
          value: null
        },
        todos: {
          done: false,
          icon: "ios-eye",
          name: "todos",
          showModal: false,
          title: "Other Questions...",
          value: null
        }
      }
    };
  },

  _refreshTodos: function(props, state) {
    var lookups = props.lookups
      , todos = lookups.todos
      , siteRight = props.currentSiteRight
      , todoEntries = _.cloneDeep(state.sections["todos"].value)
    
    if (_.isEmpty(todoEntries) || _.isEmpty(this._todoSets)) {
      todoEntries = {}, this._todoSets = {};

      // 1) are triggered by the current statusEntry
      var statusTrigger = todos.triggers.statusEntries.options[_.last(this._submitStatuses).iid];

      // 2) are a part of a site
      var siteTodos = _.filter(todos.items, (todo) => {
        return (todo.ref.model === "orgTypes") && ( _.contains(statusTrigger.todos, todo.iid) );
      });
      
      // 2) can be edited by current user orgTypeId
      var siteEntriesRef = _.pluck(siteTodos, ["ref", "path"]);

      // build todos && todoEntries
      _.each(siteEntriesRef, (siteEntryRef) => {
        let orgType = lookups.orgTypes[siteEntryRef[0]]
          , todoSet = _.pick(orgType.todos.options, (todoItem) => {
             let writeRights = _.property(["accessRights", "write"])(todoItem);
             return _.isEmpty(writeRights) ? false : _.contains(writeRights, siteRight.orgTypeId);
          });

        if (_.isEmpty(todoSet)) {
          let writeRights = _.property(["accessRights", "write"])(orgType.todos);
          todoSet = _.contains(writeRights, siteRight.orgTypeId) ? orgType.todos.options : undefined;
        }

        if (!_.isEmpty(todoSet)) {
          let orgTypeId = orgType.iid;
          this._todoSets[orgTypeId] = todoSet;
          todoEntries[orgTypeId] = _.mapValues(todoSet, (todoItem) => {
            return {
              todoId: todoItem.iid,
              value: _.isArray(todoItem.options) ? _.first(todoItem.options) : ""
            }
          });  
        }
      });

      state.sections["todos"].value = todoEntries;
    }

    this._views["todos"] =
      <View style={Styles.sectionContent}>{
        _.map(this._todoSets, (todoSet, orgTypeId) => {
          let orgTypes = lookups.orgTypes;

          return (
            <TodoSet
              editable={_.has(orgTypes[orgTypeId].todos, "accessRights") && _.contains(orgTypes[orgTypeId].todos.accessRights.write, siteRight.orgTypeId) }
              key={orgTypeId}
              moveInput={this._moveInput}
              orgType={lookups.orgTypes[orgTypeId]}
              siteRight={siteRight}
              setTodo={(newTodoSet, path, newState) => this._setSectionValue("todos", newTodoSet, path, newState)}
              todoEntrySet={todoEntries[orgTypeId]}
              todoSet={todoSet} />
          )
        })
      }
      </View>
  },

  _refreshWhere: function(props, state) {
    var currentSiteRight = props.currentSiteRight
      , sections = state.sections

    // come up with the options
    var WhereContent = !_.isEmpty(sections.where.value) ?
      <Site
        imgHost={props.lookups.hosts["images"]}
        info={sections.where.value}
        showImg={true}
        showPhoneBtn={true}
        style={{flex: 1, flexDirection: "row"}}
        themeColors={props.themeColors} /> :
      this._defaultView

    var WhereView = <View style={Styles.sectionContent}>{WhereContent}</View>

    this._views["where"] =
      <TouchableHighlight
        onPress={() => this._toggleModal(true, sections.where.name)}>
        {WhereView}
      </TouchableHighlight>
  },

  _refreshWhen: function(props, state) {
    var sections = state.sections;
    var TextSection = _.isEmpty(sections.when.value)
        ? this._defaultView
        : <Text style={Styles.contentText}>{Moment(sections.when.value).format("ddd MMM Do, YYYY, h:mm a")}</Text>;
      
    this._views["when"] = 
      <TouchableHighlight
        onPress={() => this._toggleModal(true, sections.when.name)}>
        <View style={Styles.sectionContent}>{TextSection}</View>
      </TouchableHighlight>
  },

  _renderModal: function(sectionId) {
    var props = this.props, state = this.state
      , currentSiteRight = props.currentSiteRight
      , currentUser = props.currentUser
      , lookups = props.lookups
      , imgHost = lookups.hosts["images"]
      , section = state.sections[sectionId]
      , sites = props.sites

    switch(sectionId) {
      case "when":
        let buttons = new Array(
          {
            label: "Today",
            getTimestamp: () => {
              return ["day", Moment().toDate()];
            }
          }, {
            label: "Yesterday",
            getTimestamp: () => {
              return ["day", Moment().subtract(1, 'day')._d];
            }
          }
        );

        return (
          <WhenMgr
            buttons={buttons}
            closeDisplay={() => this._toggleModal(false, sectionId)}
            initialVal={section.value}
            lookups={lookups}
            setDate={(newValue) => this._setSectionValue(sectionId, newValue, [])}
            style={Styles.sectionContent} />
        );
      break;

      case "where":
        return (
          <WhereMgr
            clientSiteId={_.isEmpty(section.value) ? null : section.value.iid}
            clientSites={sites[this._orgTypeIds.CLIENT]}
            currentUser={currentUser}
            currentSiteRight={currentSiteRight}
            imgHost={imgHost}
            leave={() => this._toggleModal(false, sectionId)}
            setSite={(newValue) => this._setSectionValue(sectionId, newValue, [])} />
        );  
      break;

      default:
        return null;
      break;
    }
  },

  _resetSections: function() {
    var state = this._refreshState();
    this.setState(state);
  },

  _setChildRef: function(ref) {
    this._childRef = ref;
  },

  _setSectionValue: function(section, newValue, path, state) {
    var newState = _.cloneDeep(this.state);
    var targetSection = newState.sections[section];

    if ( !_.eq(_.property(path)(targetSection.value), newValue)) {
      if (!path || path.length === 0) {
        targetSection.value = newValue;
        targetSection.done = _.isUndefined(state) ? !_.isEmpty(newValue) : state;
      }
      else if (path.length === 1) {
        var todoEntries = {};
        
        _.set(targetSection.value, path, newValue);
        _.each(_.toArray(targetSection.value), function(todoSet) {
          _.merge(todoEntries, todoSet);
        });

        targetSection.done = this.isDone(_.pluck(todoEntries, "value"));
      }

      targetSection.showModal = false;
      newState.sections[section] = targetSection;

      this.setState({
        sections: newState.sections
      });
    }
  },

  _toggleModal: function(state, section) {
    var sections = this.state.sections;
    sections[section].showModal = state;
    
    this.setState({
      sections: sections
    });
  },

  _renderScene: function(route, nav) {
    let state = this.state, props = this.props
      , navBar = null
      , Scene
      , themeColors = props.themeColors
      , visibleSection = _.find(state.sections, {"showModal": true})

    if (route.navigationBar) {
      navBar = React.addons.cloneWithProps(route.navigationBar, {
        navigator: nav,
        route: route
      });
    }

    switch (this.state.sceneIndex) {
      case 1:
        Scene =
          <CallScene
            currentSiteRight={props.currentSiteRight}
            lookups={props.lookups}
            section={this.state.sections["where"]}
            sites={props.sites}
            siteIds={this._siteIds}
            themeColors={themeColors}
            view={this._views["where"]} />
        break;

      default:
        Scene =
          <FormScene
            {...this.props}
            publishRef={this._setChildRef}
            resetSections={this._resetSections}
            sections={this.state.sections}
            setSectionValue={this._setSectionValue}
            siteIds={this._siteIds}
            submitStatuses={this._submitStatuses}
            todoSets={this._todoSets}
            toggleModal={this._toggleModal}
            views={this._views} />
        break;
    }

    return (
      <View style={Styles.main}>
        {navBar}
        <View style={Styles.body}>{Scene}</View>
        <Modal
          animation={false}
          visible={_.isEmpty(visibleSection) ? false : visibleSection.showModal}>
          {this._renderModal(_.isEmpty(visibleSection) ? undefined : visibleSection.name)}
        </Modal>
      </View>
    );
  },

  render: function() {
    var props = this.props, state = this.state
      , currentSiteRight = props.currentSiteRight
      , lookups = props.lookups;

    var themeColor = props.themeColors[currentSiteRight.orgTypeId];
    var navBarTitle =
      <SegmentedControlIOS
        enabled={true}
        onChange={this._changeScene}
        selectedIndex={this.state.sceneIndex}
        style={Styles.navBarTitle}
        tintColor="#FFFFFF"
        values={["Self", "Call"]} />

    var navBar =
      <NavBar
        backgroundColor={themeColor}
        buttonsColor="#FFFFFF"
        customTitle={navBarTitle} />

    return (
      <Navigator
        configureScene={this._configureScene}
        renderScene={this._renderScene}
        initialRoute={{
          navigationBar: navBar
        }} />
    );
  }
});

module.exports = NRMain;