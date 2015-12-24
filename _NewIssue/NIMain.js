'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");
var TimerMixin = require('react-timer-mixin');

// COMPONENTS
var ActionButtons = require("../Comps/ActionButtons");
var CamMgr = require("../Comps/CamMgr");
var ImgMgr = require("./ImgMgr");
var Pending = require("../Comps/Pending");
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
var Async = require("async");
var Moment = require("moment");
var _ = require("lodash");

var {
  Modal,
  PropTypes,
  ListView,
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
  topicBox: {
    backgroundColor: ViewMixin.Colors.night.section,
    borderWidth: 0.5,
    marginBottom: 16
  },
  sectionTitle: {
    borderBottomWidth: 0.5,
    flexDirection: "row",
    padding: 6,
  },
  thText: {
    color: "#FFFFFF",
    flex: 9,
    fontWeight: "bold",
    fontSize: 18,
  }, thIcon: {
    color: "#848484",
    flex: 1,
    fontSize: 22,
  },
  sectionContent: {
    paddingHorizontal: 4,
    paddingVertical: 4
  }, contentText: {
    color: ViewMixin.Colors.night.text,
    fontFamily: "System",
    fontSize: 22,
    fontWeight: "200",
    paddingHorizontal: 8,
    textAlign: "center"
  },
  notes: {
    backgroundColor: "#2E2E2E",
    borderColor: '#DF7401',
    borderRadius: 6,
    borderWidth: 1,
    color: "#FF0000",
    fontSize: 18,
    fontWeight: "200",
    height: 90,
    marginHorizontal: 6,
    padding: 6
  },

  buttonsBox: {
    bottom: ViewMixin.Dimensions.TAB_BAR_HEIGHT,
    flexDirection: "row",
    height: ViewMixin.Dimensions.NAV_BAR_HEIGHT,
    position: "absolute",
    width: Display.width
  }, btnCancel: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  }, btnSubmit: {
    flex: 4
  },
  submitting: {
    height: Display.height,
    justifyContent: "center",
    width: Display.width,
  },
})

var NIMain = React.createClass({
  mixins: [Reflux.ListenerMixin, IssueMixin, SiteMixin, TimerMixin, ViewMixin],
  propTypes: {
    currentSiteRight: PropTypes.object,
    currentUser: PropTypes.object,
    host: PropTypes.object,
    lookups: PropTypes.object,
    site: PropTypes.object,
    themeColor: PropTypes.string
  },
  _childRef: null,
  _currentWorkflow: "submit",
  _defaultView: null,
  _ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),
  _imgHost: "",
  _workflowMessages: {
    "submit": ["Waiting to Submit", "Submitting...", "Issue created!", "Error: failed to create issue"]
  },
  _views: [],

  getInitialState: function() {
    return this._refreshState();
  },

  componentWillMount: function() {
    let props = this.props;
    StatusBarIOS.setHidden(false);
    StatusBarIOS.setStyle("light-content");
    this._imgHost = props.lookups.hosts.img.provider.url;
    this._defaultView = <Text style={Styles.contentText}>--- Please Select ---</Text>;
    
    _.each(this.state.sections, (value, key) => {
      this._refresh(props, this.state, key);  
    });
  },

  componentWillUpdate: function(newProps, newState) {
    let oldState = this.state

    if ( !_.eq(newProps, this.props) ) {
      this._refresh(newProps, newState, "where");
      this._refresh(newProps, newState, "when");
      this._refresh(newProps, newState, "img");
    } else {
      if ( !_.eq(oldState.sections.where.value, newState.sections.where.value) )
        this._refresh(newProps, newState, "where");
      if ( !_.eq(oldState.sections.when.value, newState.sections.when.value) )
        this._refresh(newProps, newState, "when");
      if ( !_.eq(oldState.sections.img.value, newState.sections.img.value) )
        this._refresh(newProps, newState, "img");
    }
  },

  _addIssue: function(statusId) {
    let props = this.props, state = this.state
      , sections = state.sections
      , imgKeys = _.keys(sections.images.value)
      , geoPoint = sections["images"].value[imgKeys[0]].dbRecord.geoPoint
      , lookups = props.lookups
      , siteRight = props.currentSiteRight
      , user = props.currentUser
      , statusDef = lookups.statuses[statusId];

    // 1. create 1st status entry that will be added to issue object
    let buildStatusEntry = function() {
      return {
        authorId: user.iid,
        geoPoint: geoPoint,
        statusId: statusId,
        notes: state.notes,
        timestamp: Moment(Moment().toDate()).format()
      };
    };

    // 2. prepare New Issue Template
    let newIssue = {
      iid: "",
      firstSeen: Moment(sections["when"].value).format(),
      geoPoint: geoPoint,
      images: _.pluck(sections["images"].value, "dbRecord"),
      siteId: props.siteId,
      statusEntries: new Array(buildStatusEntry())
    };
    
    // 3. publish issue to DB -- return a promise
    return IssueActions.addIssue.triggerPromise(newIssue);
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

  _refreshState: function() {
    this._views = [];

    return {
      notes: "",
      sections: {
        when: {
          done: false,
          icon: "ios-calendar-outline",
          name: "when",
          showModal: false,
          title: "When first observed...",
          value: null
        },
        where: {
          done: false,
          icon: "ios-location",
          name: "where",
          showModal: false,
          title: "Where is hazard located...",
          value: null
        },
        img: {
          done: false,
          icon: "alert-circled",
          name: "img",
          showModal: false,
          title: "What does it look like...",
          value: null
        }
      },
      workflowStages: {
        submit: [
          {
            isActive: true,
            end: false,
            success: true
          }, {
            isActive: false,
            end: false,
            success: true
          }, {
            isActive: false,
            end: true,
            success: true
          }, {
            isActive: false,
            end: true,
            success: false
          }
        ]
      }
    };
  },

  _refresh: function(props, state, section) {
    let sections = state.sections,
      { currentSiteRight, lookups } = props;

    switch (section) {
      case "when":
        let TextSection = _.isEmpty(sections[section].value) ? this._defaultView :
          <Text style={Styles.contentText}>{Moment(sections[section].value).format("ddd MMM Do, YYYY, h:mm a")}</Text>;
          
        this._views[section] = 
          <TouchableHighlight
            onPress={() => this._toggleModal(true, sections[section].name)}>
            <View style={Styles.sectionContent}>{TextSection}</View>
          </TouchableHighlight>
        break;

      case "where":
        let site = props.sites[currentSiteRight.siteId];

        // come up with the options
        this._views[section] =
          <Site
            imgHost={lookups.hosts.img.provider}
            info={site}
            showImg={true}
            showPhoneBtn={true}
            style={ [Styles.sectionContent, {flex: 1, flexDirection: "row"}] }
            themeColor={props.themeColor} />

        state.sections[section].value = site, state.sections[section].done = _.isEmpty(site) ? false : true;
        break;

      case "img":
        let imgSection = sections[section];
          // , doneState = imgSection.done ? "on" : "off";

        this._views[section] =
          <ImgMgr
            openCam={() => this._toggleModal(true, section)}
            img={imgSection.value}
            lookups={lookups}
            setImg={(newImg, newState) => this._setSectionValue(section, newImg, [], newState)}
            style={Styles.sectionContent} />

      default:
        return;
    }
  },

  _resetSections: function() {
    this.setState(this._refreshState());
  },

  _setChildRef: function() {
    this._childRef = this.refs.listView;
  },

  _setSectionValue: function(section, newValue, path, state, doneCb) {
    let sections = _.cloneDeep(this.state.sections)
      , targetSection = sections[section];

    if ( !_.eq(_.property(path)(targetSection.value), newValue)) {
      if ( _.isEmpty(path) ) {
        targetSection.value = newValue;
        targetSection.done = _.isUndefined(state) ? !_.isEmpty(newValue) : state;
      }

      targetSection.showModal = false;
      sections[section] = targetSection;

      this.setState({ sections: sections });
    }

    if ( !_.isEmpty(doneCb) )
      doneCb();
  },

  _setWorkflowStage: function(workflow, level) {
    this._currentWorkflow = workflow;
    let workflowStages = _.map(this.state.workflowStages[workflow], (stage) => {
      stage.isActive = false;
      return stage;
    });

    workflowStages[level].isActive = true;
    this.state.workflowStages[workflow] = workflowStages;
    this.setState(this.state);

    if (level === 0)
      this._resetSections();
  },

  _submitIssue: function(status) {
    let self = this;

    let addToSite = function(issueId, orgTypeId, siteId) {
     return SiteActions.setIssueId.triggerPromise(issueId, siteId);
    };

    // 1. Turn Progress Indidicator on
    this._setWorkflowStage("submit", 1);

    // 2. Add images and create tow issue
    Async.parallel([
      (uploadImagesCb) => {
        // 2a. Add images to Image Host Provider
        this._uploadImages().then(() => {
          // qImages.resolve();
          uploadImagesCb(null, "All images successfully added");
        }).catch((err) => {
          // qImages.reject();
          uploadImagesCb("Couldn't add new Img", null);
        });
      },
      (addToDbCb) => {
        // 2b. Add Tow Issue to DB
        this._addIssue(status.iid).then((issueId) => {
          addToDbCb(null, issueId);
        }).catch(() => {
          addToDbCb("Couldn't add Issue", null);
        })
      }
    ], (err, results) => {
      // 3. Add issueId to corresponding sites
      let qSites, issueId = results[1];

      if (status.assignTo[this._orgTypeIds.VENDOR].site === false)
        qSites = addToSite(issueId, this._orgTypeIds.CLIENT, this.props.siteIds[this._orgTypeIds.CLIENT]);
      else
        qSites = _.map(self._siteIds, (siteId, orgTypeId) => {
          return addToSite(issueId, orgTypeId, siteId);
        });

      new Promise.all(qSites).then(() => {
        console.log("All sites updated with issueId")
        self._setWorkflowStage("submit", 2);
      }).catch(() => {
        self._setWorkflowStage("submit", 3);
      });
    });
  },

  _toggleModal: function(state, section) {
    let sections = this.state.sections;
    sections[section].showModal = state;
    
    this.setState({ sections: sections });
  },

  _uploadImages: function() {
    let qImages = new Promise.all(_.map(this.props.sections["images"].value, (stagedImg) => {
      return IssueActions.uploadImg.triggerPromise(stagedImg);
    }));

    return qImages;
  },

  _renderModal: function(sectionId) {
    let props = this.props, state = this.state, {
      currentSiteRight,
      currentUser,
      lookups,
      site
    } = props;
      
    let section = state.sections[sectionId];

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

      case "img":
        return (
          <CamMgr
            exitCamMgr={() => this._toggleModal(false, sectionId)}
            imgHost={this._imgHost}
            prevImg={section.value}
            setImg={(newImg, doneCb) => this._setSectionValue(sectionId, newImg, [], true, doneCb)} />
        );

      default:
        return null;
      break;
    }
  },

  _renderSection: function(section, sectionId, rowId) {
    let props = this.props
      , themeColor = props.themeColor
      , textStyle = section.done ? {color: themeColor} : this.Styles._textStyle["need"]
      , viewStyle = section.done ? {borderColor: themeColor} : this.Styles._viewStyle["need"];

    return (
      <View key={rowId} style={[Styles.topicBox, viewStyle]}>
        <View style={ [Styles.sectionTitle, viewStyle] }>
          <Icon
            name={section.icon}
            style={ [Styles.thIcon, textStyle] } />
          <Text style={ [Styles.thText, textStyle] }>{section.title}</Text>
        </View>
        {this._views[section.name]}
      </View>
    );
  },

  render: function() {
    let props = this.props, state = this.state, {
      currentSiteRight,
      currentUser,
      lookups,
      site,
      themeColor
    } = props;

    let imgHost = lookups.hosts["images"]
      , issue = state.issue
      , visibleSection = _.find(state.sections, {"showModal": true})
      , workflowMessages = this._workflowMessages[this._currentWorkflow]
      , workflowStages = state.workflowStages[this._currentWorkflow];

    return (
      <View style={Styles.main}>
        <Modal
          animation={false}
          visible={!workflowStages[0].isActive}>
          <Pending
            setDone={() => this._setWorkflowStage(this._currentWorkflow, 0)}
            style={Styles.submitting}
            workflowMessages={workflowMessages}
            workflowStages={workflowStages} />
        </Modal>
        <ListView
          ref="listView"
          dataSource={this._ds.cloneWithRows(state.sections)}
          keyboardShouldPersistTaps={false}
          removeClippedSubviews={true}
          renderRow={this._renderSection}
          scrollEventThrottle={200} />
        <ActionButtons
          cancel={this._resetSections}
          inputChanged={_.every(state.sections, "done", true)}
          saveData={() => this._submitIssue(_.last(this._submitStatuses))}
          style={Styles.buttonsBox}
          themeColor={props.themeColor} />
        <Modal
          animation={false}
          visible={_.isEmpty(visibleSection) ? false : visibleSection.showModal}>
          {this._renderModal(_.isEmpty(visibleSection) ? undefined : visibleSection.name)}
        </Modal>
      </View>
    );
  }
});

module.exports = NIMain;