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
var IssueActions = require("../Actions/IssueActions");
var SiteActions = require("../Actions/SiteActions");

// Utilities
var Async = require("async");
var Moment = require("moment");
var _ = require("lodash");
var { Modal, PropTypes, ListView, StatusBarIOS, StyleSheet, Text, TextInput, TouchableHighlight, View } = React;
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
  _ds: new ListView.DataSource({rowHasChanged: (r1, r2) => r1.guid !== r2.guid}),
  _imgHost: "",
  _site: null,
  _submitStatus: null,
  _workflowMessages: {
    "submit": ["Waiting to Submit", "Submitting...", "Issue created!", "Error: failed to create issue"]
  },

  getInitialState: function() {
    return this._refreshState();
  },

  componentWillMount: function() {
    let { currentSiteRight, lookups, sites } = this.props
      , { hosts, statuses } = lookups;

    StatusBarIOS.setHidden(false);
    StatusBarIOS.setStyle("light-content");
    this._imgHost = hosts.img.provider.url;
    this._site = sites[currentSiteRight.siteId];
    this._submitStatus = _.find(statuses, (status) => {
      return !_.has(status, "prevStatuses");
    });
  },

  _addIssue: function(statusDef) {
    let { notes, sections } = this.state
      , { lookups, currentSiteRight, currentUser } = this.props
      , dbRecord = sections["img"].value.dbRecord;

    // 1. create 1st status entry that will be added to issue object
    let buildStatusEntry = function() {
      return {
        authorId: currentUser.iid,
        geoPoint: dbRecord.geoPoint,
        statusId: statusDef.iid,
        notes: notes,
        timestamp: Moment(Moment().toDate()).format()
      };
    };

    // 2. prepare New Issue Template
    let newIssue = {
      iid: "",
      firstSeen: Moment(sections["when"].value).format(),
      geoPoint: dbRecord.geoPoint,
      images: [dbRecord],
      siteId: this._site.iid,
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

  _resetSections: function() {
    this.setState(this._refreshState());
  },

  _setChildRef: function() {
    this._childRef = this.refs.listView;
  },

  _setSectionValue: function(section, newValue, path, doneCb, rejectCb) {
    let sections = _.cloneDeep(this.state.sections)
      // , targetSection = sections[section];
    if ( !_.isUndefined(doneCb) )
      doneCb();
    
    if ( !_.eq(_.property(path)(sections[section].value), newValue)) {
      if ( _.isEmpty(path) ) {
        sections[section].value = newValue;
        sections[section].done = !_.isEmpty(newValue);
      }

      // targetSection.showModal = showModal;
      this.setState({ sections: sections });
    }
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

  _submitIssue: function(statusDef) {
    let self = this;
    // 1. Turn Progress Indidicator on
    this._setWorkflowStage("submit", 1);

    // 2. Add images and create tow issue
    Async.parallel([
      (uploadImagesCb) => {
        // 2a. Add images to Image Host Provider
        this._uploadImages().then(() => {
          uploadImagesCb(null, "All images successfully added");
        }).catch((err) => {
          uploadImagesCb("Couldn't add new Img", null);
        });
      },
      (addToDbCb) => {
        // 2b. Add Tow Issue to DB
        this._addIssue(statusDef).then((issueId) => {
          addToDbCb(null, issueId);
        }).catch(() => {
          addToDbCb("Couldn't add Issue", null);
        })
      }
    ], (err, results) => {
      // 3. Add issueId to corresponding sites
      let issueId = results[1];
      SiteActions.setIssueId.triggerPromise(issueId, this._site.iid).then(() => {
        console.log("All sites updated with issueId")
        self._setWorkflowStage("submit", 2);
      }).catch(() => {
        self._setWorkflowStage("submit", 3);
      });
    });
  },

  _toggleModal: function(state, section) {
    let sections = _.cloneDeep(this.state.sections);
    sections[section].showModal = state;
    
    this.setState({ sections: sections });
  },

  _uploadImages: function() {
    // let qImages = new Promise.all(_.map(this.props.sections["images"].value, (stagedImg) => {
    //   return IssueActions.uploadImg.triggerPromise(this.props.sections["img"].value);
    // }));

    return IssueActions.uploadImg.triggerPromise(this.state.sections["img"].value);
  },

  _renderModal: function(sectionId) {
    let { sections } = this.state
      , { currentSiteRight, currentUser, lookups, sites } = this.props
      , section = sections[sectionId];

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
            currentUser={currentUser}
            currentSiteRight={currentSiteRight}
            imgHost={this._imgHost}
            leave={() => this._toggleModal(false, sectionId)}
            setSite={(newValue) => this._setSectionValue(sectionId, newValue, [])} />
        );  
        break;

      case "img":
        return (
          <CamMgr
            exitCamMgr={() => this._toggleModal(false, sectionId)}
            prevImg={section.value}
            setImg={(newImg, doneCb) => this._setSectionValue(sectionId, newImg, [], doneCb)} />
        );

      default:
        return null;
      break;
    }
  },

  _renderSection: function(section, sectionId, rowId) {
    let currentSection = this.state.sections[rowId]
      , { currentSiteRight, lookups, sites, themeColor } = this.props
      , textStyle = section.done ? {color: themeColor} : this.Styles._textStyle["need"]
      , viewStyle = section.done ? {borderColor: themeColor} : this.Styles._viewStyle["need"]
      , SectionView = null;

    switch (rowId) {
      case "when":
        let TextSection = _.isEmpty(currentSection.value) ?
          <Text style={Styles.contentText}>--- Please Select ---</Text> :
          <Text style={Styles.contentText}>{Moment(currentSection.value).format("ddd MMM Do, YYYY, h:mm a")}</Text>;
          
        SectionView = 
          <TouchableHighlight
            onPress={() => this._toggleModal(true, currentSection.name)}>
            <View style={Styles.sectionContent}>{TextSection}</View>
          </TouchableHighlight>
        break;

      case "where":
        // let site = sites[currentSiteRight.siteId];
        let site = this._site;

        // come up with the options
        SectionView =
          <Site
            imgHost={this._imgHost}
            info={site}
            showImg={true}
            showPhoneBtn={true}
            style={ [Styles.sectionContent, {flex: 1, flexDirection: "row"}] }
            themeColor={themeColor} />

        _.assign(this.state.sections[rowId], {
          value: site,
          done: _.isEmpty(site) ? false : true
        });
        break;

      case "img":
        SectionView =
          <ImgMgr
            openCam={() => this._toggleModal(true, rowId)}
            img={currentSection.value}
            lookups={lookups}
            style={Styles.sectionContent} />
        break;
    }

    return (
      <View key={rowId} style={[Styles.topicBox, viewStyle]}>
        <View style={ [Styles.sectionTitle, viewStyle] }>
          <Icon
            name={section.icon}
            style={ [Styles.thIcon, textStyle] } />
          <Text style={ [Styles.thText, textStyle] }>{section.title}</Text>
        </View>
        {SectionView}
      </View>
    );
  },

  render: function() {
    let { issue, sections, workflowStages } = this.state
      , { currentSiteRight, currentUser, lookups, sites, themeColor } = this.props
      , visibleSection = _.find(sections, {"showModal": true})
      , workflowMessages = this._workflowMessages[this._currentWorkflow]
      , currentWorkflowStages = workflowStages[this._currentWorkflow];

    return (
      <View style={Styles.main}>
        <Modal animation={false} visible={!currentWorkflowStages[0].isActive}>
          <Pending
            setDone={() => this._setWorkflowStage(this._currentWorkflow, 0)}
            style={Styles.submitting}
            workflowMessages={workflowMessages}
            workflowStages={currentWorkflowStages} />
        </Modal>
        <ListView
          ref="listView"
          dataSource={this._ds.cloneWithRows(sections)}
          keyboardShouldPersistTaps={false}
          removeClippedSubviews={true}
          renderRow={this._renderSection}
          scrollEventThrottle={200} />
        <ActionButtons
          cancel={this._resetSections}
          inputChanged={_.every(sections, "done", true)}
          saveData={() => this._submitIssue(this._submitStatus)}
          style={Styles.buttonsBox}
          themeColor={themeColor} />
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