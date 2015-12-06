'use strict';

// REACT PARTS
var Display = require('react-native-device-display');
var Loading = require('react-native-loading-effect');
var React = require("react-native");

// COMPONENTS

// ACTIONS && STORES

// Utilities
var _ = require("lodash");

var {
  AlertIOS,
  PropTypes,
  StyleSheet,
  Text,
  VibrationIOS,
  View,
} = React;

var Pending = React.createClass({
  propTypes: {
    setDone: PropTypes.func,
    style: PropTypes.number,
    workflowMessages: PropTypes.array,
    workflowStages: PropTypes.array
  },

  _styles: StyleSheet.create({
    done: {
      backgroundColor: "#FFFFFF",
      opacity: 0.9
    }, doneText: {
      color: "#000000",
      fontSize: 24,
      fontFamily: "System"
    },
    pending: {
      backgroundColor: "#000000",
      opacity: 0.65
    },
  }),

  componentWillReceiveProps: function(newProps) {
    var stageIndex = _.findIndex(newProps.workflowStages, {"isActive": true});
    // var currentIndex = _.findWhere(newProps.workflowStages, {"isActive": true});
    var currentStage = newProps.workflowStages[stageIndex];
    var stageMsg = newProps.workflowMessages[stageIndex];

    if (currentStage.end) {
      AlertIOS.alert(stageMsg, "", [
        {
          text: 'Okay',
          onPress: this.props.setDone
        }
      ]);

    if (currentStage.success)
      VibrationIOS.vibrate();
    }
  },
  
  render: function() {
    var inProcessStage = this.props.workflowStages[1];
    var inProcessMsg = this.props.workflowMessages[1];

    if ( inProcessStage.isActive )
      return (
        <View style={ [this.props.style, this._styles.pending ] }>
          <Loading
            color="#FFBF00"
            isVisible={inProcessStage.isActive}
            overlayWidth={Display.width/3}
            size="large"
            text={inProcessMsg}
            textColor="#FFBF00"
            textFontSize={20} />
        </View>
      );
    else
      return null;
  },
});

module.exports = Pending;