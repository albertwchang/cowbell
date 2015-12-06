var React = require("react-native");
var Carousel = require("react-native-carousel");
var Display = require('react-native-device-display');
var Icon = require("react-native-vector-icons/Ionicons");

// Utilities
var _ = require("lodash");

var {
	Image,
	PropTypes,
	StyleSheet,
	Text,
	TouchableHighlight,
	View,
} = React;

var styles = StyleSheet.create({
	image: {
		flex: 1,
		backgroundColor: "red",
		width: 300,
	}
})

var IssueImage = React.createClass({
	propTypes: {
		aspectRatio: PropTypes.number,
		imgHost: PropTypes.object,
		uris: PropTypes.array
	},
	getDefaultProps: function() {
		return {
			aspectRatio: 21/9,
		}
	},

	render: function() {
		var component;
		var imgHostUrl = this.props.imgHost.url;
		var imgStyle = {
			flex: 1,
			justifyContent: 'center',
	    resizeMode: "contain",
	    width: Display.width,
	    height: Display.width / this.props.aspectRatio,
		};

		if ( !_.has(this.props, "uris") || this.props.uris.length == 0 ) {
			component = null;
		} else if (this.props.uris.length == 1) {
			var imgUri = imgHostUrl +this.props.uris[0] +"?fit=crop&w=" +imgStyle.width +"&h=" +imgStyle.height;
			component = 
				<Image
					style={imgStyle}
					source={{ uri: imgUri }} />
		} else {
			var imgUriParams = "?fit=crop&w=" +imgStyle.width +"&h=" +imgStyle.height;
			
			return (
				<Carousel style={imgStyle}>{
					_.map(this.props.uris, (uri) => (
      			<Image
      				key={uri}
							style={imgStyle}
							source={{uri: imgHostUrl +uri +imgUriParams}} />
        	))}
				</Carousel>
			);
		}

		return (component);
	}
});

module.exports = IssueImage;