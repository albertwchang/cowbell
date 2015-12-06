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
var Pending = require("../Comps/Pending");
var Site = require("../Comps/Site");

// MIXINS
var IssueMixin = require("../Mixins/Issue");
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES
var ProfileActions = require("../Actions/ProfileActions");
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");

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
  View,
} = React;

var Styles = StyleSheet.create({
  main: {
    flex: 1,
    flexDirection: "column"
  },
  topicBox: {
    backgroundColor: ViewMixin.Colors.night.section,
    borderWidth: 0.5,
    marginBottom: 16
  },
  sectionTitle: {
    borderBottomColor: "#FFFFFF",
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
    color: "#848484",
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
    bottom: 0,
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

var FormScene = React.createClass({
  mixins: [Reflux.ListenerMixin, IssueMixin, SiteMixin, TimerMixin, ViewMixin],
  propTypes: {
    currentSiteRight: PropTypes.object,
    currentUser: PropTypes.object,
    db: PropTypes.object,
    lookups: PropTypes.object,
    publishRef: PropTypes.func,
    resetSections: PropTypes.func,
    sections: PropTypes.object,
    setSectionValue: PropTypes.func,
    sites: PropTypes.object,
    siteIds: PropTypes.object,
    submitStatuses: PropTypes.array,
    themeColors: PropTypes.array,
    todoSets: PropTypes.object,
    views: PropTypes.array
  },
  _currentWorkflow: "submit",
  _workflowMessages: {
    "submit": ["Waiting to Submit", "Submitting...", "Issue created!", "Error: failed to create issue"]
  },

  getInitialState: function() {
    return {
      ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),
      notes: "",
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
    }
  },

  componentWillMount: function() {
    StatusBarIOS.setHidden(false);
    StatusBarIOS.setStyle("light-content");
  },

  _addIssue: function(statusId) {
    var props = this.props, state = this.state
      , sections = props.sections
      , imgKeys = _.keys(sections.images.value)
      , geoPoint = sections["images"].value[imgKeys[0]].dbRecord.geoPoint
      , lookups = props.lookups
      , siteRight = props.currentSiteRight
      , user = props.currentUser
    
    var statusDef = lookups.statuses[statusId];

    // 1. create 1st status entry that will be added to issue object
    var buildStatusEntry = function() {
      return {
        author: {
          id: user.iid,
          orgTypeId: siteRight.orgTypeId,
        },
        geoPoint: geoPoint,
        statusId: statusId,
        notes: state.notes,
        timestamp: Moment(Moment().toDate()).format()
      };
    };

    // 2. prepare New Issue Template
    var newIssue = {
      iid: "",
      firstSeen: Moment(sections["when"].value).format(),
      geoPoint: geoPoint,
      images: _.pluck(sections["images"].value, "dbRecord"),
      sites: this.buildSites(props.siteIds,
        statusDef,
        sections.todos.value,
        _.chain(_.cloneDeep(lookups.orgTypes)).mapValues(_.property(["todos", "options"])).omit(_.isEmpty).value() ),
      statusEntries: new Array(buildStatusEntry()),
      todoMap: null,
      vehicle: this.buildVehicle(lookups.vehicle.options)
    };

    newIssue["todoMap"] = this.buildTodoMap(lookups, newIssue);
    
    // 3. publish issue to DB -- return a promise
    return IssueActions.addIssue.triggerPromise(newIssue);
  },

  _uploadImages: function() {
    let qImages = new Promise.all(_.map(this.props.sections["images"].value, (stagedImg) => {
      return IssueActions.uploadImg.triggerPromise(stagedImg);
    }));

    return qImages;
  },

  _publishRef: function() {
    this.props.publishRef(this.refs.listView);
  },

  // _refreshStatusDefs: function(props, state) {
  //   //   // Get all applicable statusRefs that can be used for submitting tow issue:
  //   if ( _.eq(props.currentSiteRight, this.props.currentSiteRight) )
  //     this._submitStatuses = this.getSubmitStatuses(props.lookups.statuses, props.currentSiteRight);  
  // },
  
  _submitIssue: function(status) {
    var self = this;

    var addToSite = function(issueId, orgTypeId, siteId) {
     return SiteActions.setIssueId.triggerPromise(issueId, siteId, orgTypeId);
    };

    // 1. Turn Progress Indidicator on
    this._setWorkflowStage("submit", 1);

    // 2. Add images and create tow request
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
          addToDbCb("Couldn't add Tow Issue", null);
        })
      }
    ], (err, results) => {
      // 3. Add issueId to corresponding sites
      var qSites, issueId = results[1];

      if (status.assignTo[this._orgTypeIds.VENDOR].site === false)
        qSites = addToSite(issueId, this._orgTypeIds.CLIENT, this.props.siteIds[this._orgTypeIds.CLIENT]);
      else
        qSites = _.map(self._siteIds, (siteId, orgTypeId) => {
          return addToSite(issueId, orgTypeId, siteId);
        });

      Promise.all(qSites).then(() => {
        console.log("All sites updated with issueId")
        self._setWorkflowStage("submit", 2);
      }).catch(() => {
        self._setWorkflowStage("submit", 3);
      });
    });
  },

  _setWorkflowStage: function(workflow, level) {
    this._currentWorkflow = workflow;
    var workflowStages = _.map(this.state.workflowStages[workflow], (stage) => {
      stage.isActive = false;
      return stage;
    });

    workflowStages[level].isActive = true;
    this.state.workflowStages[workflow] = workflowStages;
    this.setState(this.state);

    if (level === 0)
      this.props.resetSections();
  },

  _renderSection: function(section, sectionId, rowId) {
    let props = this.props;
    var themeColor = props.themeColors[props.currentSiteRight.orgTypeId]
      , textStyle = section.done ? {color: themeColor} : this.Styles._textStyle["need"]
      , viewStyle = section.done ? {borderColor: themeColor} : this.Styles._viewStyle["need"];

    return (
      <View key={rowId} style={[Styles.topicBox, viewStyle]}>
        <View style={Styles.sectionTitle}>
          <Icon
            name={section.icon}
            style={ [Styles.thIcon, textStyle] } />
          <Text style={ [Styles.thText, textStyle] }>{section.title}</Text>
        </View>
        {props.views[section.name]}
      </View>
    );
  },

  render: function() {
    var props = this.props, state = this.state
      , currentSiteRight = props.currentSiteRight
      , currentUser = props.currentUser
      , lookups = props.lookups
      , imgHost = lookups.hosts["images"]
      , sections = props.sections
      , showActionButtons = _.every(sections, "done", true)
      , sites = props.sites
      , site = sections.where.value || (currentSiteRight.orgTypeId === this._orgTypeIds.CLIENT ? sites[this._orgTypeIds.CLIENT][currentSiteRight.siteId] : null)
      , workflowMessages = this._workflowMessages[this._currentWorkflow]
      , workflowStages = state.workflowStages[this._currentWorkflow];

    return (
      <View
        onLayout={this._publishRef}
        style={[Styles.main, {height: showActionButtons ? Display.height - this.Dimensions.STATUS_BAR_HEIGHT - this.Dimensions.NAV_BAR_HEIGHT - this.Dimensions.TAB_BAR_HEIGHT : 0}]}>
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
          contentInset={{top: -this.Dimensions.STATUS_BAR_HEIGHT+1}}
          dataSource={state.ds.cloneWithRows(sections)}
          keyboardShouldPersistTaps={false}
          removeClippedSubviews={true}
          renderRow={this._renderSection}
          scrollEventThrottle={200} />
        <ActionButtons
          cancel={props.resetSections}
          inputChanged={_.every(sections, "done", true)}
          saveData={() => this._submitIssue(_.last(this.props.submitStatuses))}
          style={Styles.buttonsBox}
          themeColor={props.themeColors[currentSiteRight.orgTypeId]} />
      </View>
    );
  }
});

module.exports = FormScene;