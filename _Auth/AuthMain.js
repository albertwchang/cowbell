'use strict';

// REACT NATIVE PARTS
var React = require("react-native");
var Reflux = require("reflux");

// PERSONAL COMPONENTS
var LoginScene = require("./LoginScene");
// var RegisterScene = require("../Scenes/RegisterScene");

var {
  PropTypes,
	Text,
	View
} = React;

var AuthMain = React.createClass({
  propTypes: {
    db: PropTypes.object,
    lookups: PropTypes.object,
    initSession: PropTypes.func,
    setInProgress: PropTypes.func,
    style: PropTypes.number
  },
  getDefaultProps: function() {
    return { resolveDependencies: null }
  },

  getInitialState: function() {
    return { preferredScene: "login" };
  },

  componentWillMount: function() {
    console.log("Auth Context Mounted");
  },

  componentWillUnmount: function() {
    console.log("Auth Context unMounted");
  },

  render: function() {
    let Content = (this.state.preferredScene === "login")
        ? <LoginScene {...this.props} />
        : <RegisterScene {...this.props} />
    
    return ( <View style={this.props.style}>{Content}</View> );
  },
});

module.exports = AuthMain;