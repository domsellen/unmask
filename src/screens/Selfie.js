import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as firebase from 'firebase';

import { uploadSelfie } from '../actions';

class Selfie extends Component {
  componentWillMount() {
    // Listener user
    firebase.database().ref('CodeCapulets/people/' + this.props.user.id).on('value', snapshot => {
      console.log(snapshot.val());
      this.props.userStatus(snapshot.val());
    });
  }
  render() {
    return (
      <div className="content">
        <div className="container">
          <h1>Hi {this.props.user.name}!</h1>
          <input type="file" accept="image/*" capture onChange={(e) => this.props.uploadSelfie(e.target.files[0])} />
          <p>Alright! You're in! <br />For the game, we need a picture from you with your awesome costume. So take a selfie and upload it here!</p>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  console.log(state.data.user)
  return {
    user: state.data.user
  };
}

export default connect(mapStateToProps, { uploadSelfie })(Selfie);
