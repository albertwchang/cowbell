'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");
var Reflux = require("reflux");

// COMPONENTS
var LineSeparator = require("../Comps/LineSeparator");
var Site = require("../Comps/Site");

// MIXINS
var SiteMixin = require("../Mixins/Site");
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES

// Utilities
var Async = require("async");
var Moment = require("moment");
var _ = require("lodash");

var {
  ActionSheetIOS,
  Image,
  Modal,
  Navigator,
  PropTypes,
  ScrollView,
  StatusBarIOS,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

var Styles = StyleSheet.create({
  main: {
    flex: 1,
    flexDirection: "column"
  },
  topicBox: {
    backgroundColor: "#424242",
    borderWidth: 1,
    margin: 0
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
  site: {
    flex: 1,
    flexDirection: "row",
    padding: 2,
    marginHorizontal: 2
  }
})

var CallScene = React.createClass({
  mixins: [SiteMixin, ViewMixin],
  propTypes: {
    currentSiteRight: PropTypes.object,
    lookups: PropTypes.object,
    themeColors: PropTypes.array,
    section: PropTypes.object,
    sites: PropTypes.object,
    siteIds: PropTypes.object,
    view: PropTypes.object
  },

  render: function() {
    let props = this.props
      , section = props.section
      , siteRight = props.currentSiteRight
      , themeColor = props.themeColors[this._orgTypeIds.CLIENT]
      , textStyle = section.done ? {color: themeColor} : this.Styles._textStyle["off"]
      , viewStyle = section.done ? {borderColor: themeColor} : this.Styles._viewStyle["off"]
      , siteIds = _.omit(props.siteIds, (siteId, orgTypeId) => {
        return _.isEmpty(siteId) || (orgTypeId === this._orgTypeIds.CLIENT);
      });

    return (
      <ScrollView
        contentInset={{top: -this.Dimensions.STATUS_BAR_HEIGHT}}
        ref="ScrollView"
        keyboardShouldPersistTaps={false}
        scrollEventThrottle={200}
        style={Styles.main}>
        <View style={ [Styles.topicBox, viewStyle] }>
          <View style={Styles.sectionTitle}>
            <Icon
              name={props.section.icon}
              style={ [Styles.thIcon, textStyle] } />
            <Text style={ [Styles.thText, textStyle] }>{props.section.title}</Text>
          </View>
          {props.view}
        </View>
        <LineSeparator height={0} horizMargin={0} vertMargin={8} />
        {_.map(siteIds, (siteId, orgTypeId) => {
          let props = this.props
            , site = props.sites[orgTypeId][siteId]
            , Content = _.isEmpty(site)
              ? <View key={siteId}><Text style={{fontSize: 20, color: "red"}}>No Site for {orgTypeId}</Text></View>
              : <Site
                  key={siteId}
                  info={site}
                  imgHost={props.lookups.hosts["images"]}
                  showImg={true}
                  showPhoneBtn={true}
                  style={Styles.site}
                  themeColors={props.themeColors} />

          return (
            <View key={siteId}>
              {Content}
              <LineSeparator height={0.5} horizMargin={0} vertMargin={10} />
            </View>
          );
        })}
      </ScrollView>
    );
  }
});

module.exports = CallScene;