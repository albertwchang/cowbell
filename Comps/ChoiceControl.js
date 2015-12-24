'use strict';

var Icon = require('react-native-vector-icons/Ionicons');
var React = require("react-native");

// MIXINS
var ViewMixin = require("../Mixins/View");

// ACTIONS && STORES

// Utilities

var { PropTypes, StyleSheet, TouchableHighlight, View } = React;
var ChoiceControl = React.createClass({
  mixins: [ViewMixin],
  propTypes: {
    accept: PropTypes.func,
    styles: PropTypes.object,
    trash: PropTypes.func
  },

  render: function() {
    let { styles, accept, trash } = this.props;
    
    return (
      <View style={[ styles.controlPanel ]}>
        <View style={styles.btn}></View>
        <TouchableHighlight onPress={accept} style={styles.btn}>
          <Icon
            name={"ios-checkmark-outline"}
            style={ [styles.btnIcon, {color: "#01DF01"}] } />
        </TouchableHighlight>
        <TouchableHighlight onPress={trash} style={styles.btn}>
          <Icon
            name={"ios-trash-outline"}
            style={ [styles.btnIcon, {color: "#FF0000"}] } />
        </TouchableHighlight>
        <View style={styles.btn}></View>
      </View>
    );
  }
})

module.exports = ChoiceControl;