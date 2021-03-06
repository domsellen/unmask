import React, { Component } from 'react';

import Loading from '../Loading';

export default class Target extends Component {
  render() {
    const { user } = this.props
    console.log(user)
    const targetsArray = Object.keys(user.targets).map((key) => user.targets[key])
    const activeTarget = targetsArray.find(target => {
      // success is false
      return target.success === false;
    });
    if(activeTarget) {
      return (
        <div className='container bgWhite'>
          <img className="avatar avatarBig centerImage" src={activeTarget.selfieUrl} alt='profilePicture' />
          <p className='center'>Make <b>{activeTarget.name}</b> say</p>
          <h2 className='center'>{activeTarget.word}</h2>
        </div>
      )
    } else {
      return <Loading />
    }

  }
}
