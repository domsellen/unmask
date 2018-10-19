import { SET_GAME, USERS_ENROLMENT, LOGIN_USER, LOADING, GAME_STATUS, SCORE_STATUS, UPDATE_USER } from './types.js';
import * as firebase from "firebase";
import { database } from '../config/firebase';
import history from '../auth/history';

export function setGame(gameCode) {
  return function(dispatch) {
    if(!gameCode) {
      dispatch({ type: SET_GAME, payload: null });
    } else {
      dispatch({ type: SET_GAME, payload: gameCode });
      firebase.database().ref('games/' + gameCode).once('value')
      .then(snapshot => {
        if (!snapshot.val()) {
          dispatch({ type: SET_GAME, payload: false });
        }
      })
    }
  }
}

export const newGame = (user) => (dispatch, getState) => {
  firebase.database().ref().push({
    game : false,
    words : ['Ananas', 'Kiwi']
  })
    .then((snapshot) => {
      console.log('New game: ' + snapshot.key)
      history.push('/?game=' + snapshot.key)

      var provider = new firebase.auth.FacebookAuthProvider();
      firebase.auth().signInWithRedirect(provider).then(function(result) {
        var user = result.user;
        this.props.login(user)
      }).catch(function(error) { console.log(error) });
  })
}

export const login = (user) => (dispatch, getState) => {
  if(user === null) {
    // user not logged in
    console.log('User not logged in')
    dispatch({ type: LOGIN_USER, payload: {loggedIn: false} });
  } else {
    console.log('User logged in')
    // add user to people
    database.ref('/people/' + user.uid).once('value')
    .then(snapshot => snapshot.val()).then(val => {
      if(val) {
        console.log(val)
        val.loggedIn = true;
        dispatch({ type: LOGIN_USER, payload: val });
      } else {
        let params = {
          loggedIn: true,
          uid: user.uid,
          fbPhotoUrl: user.photoURL,
          name: user.displayName
        }
        firebase.database().ref('/people/' + user.uid).update(params);
        dispatch({ type: LOGIN_USER, payload: params });
      }
    })
    let { gameExists } = getState().general;
    if (gameExists) {
      let game = 'games/' + gameExists
      // if game exists
      firebase.database().ref( game + '/people/').once('value')
      .then(snapshot => snapshot.val()).then(val => {
        if(val && val[user.uid]) {
          dispatch({ type: UPDATE_USER, payload: val[user.uid], });
        } else {
          const admin = val ? false : true
          let params = {
            id: user.uid,
            admin: admin,
            fbPhotoUrl: user.photoURL,
            name: user.displayName,
            family: '',
            selfieUrl: '',
            targettedBy: [],
            alive: true,
          }
          firebase.database().ref('/' + game + '/people/' + user.uid).update(params);
          dispatch({ type: UPDATE_USER, payload: params, });
        }
      })

      firebase.database().ref('/' + game + '/people/' + user.uid).on('value', (snapshot) => {
        dispatch({ type: UPDATE_USER, payload: snapshot.val() })
        // Count all registered for game
        firebase.database().ref('/' + game + '/people/').on('value', (snapshot) => {
          if(snapshot.val()) {
            const peopleArray = Object.keys(snapshot.val()).map((key) => snapshot.val()[key])
            let amountRegistered = peopleArray.length;
            let amountReady = 0;
            peopleArray.forEach(person => {
              person.enrolled === true ? amountReady ++ : '';
            });
            dispatch({ type: USERS_ENROLMENT, registered: amountRegistered, ready: amountReady });
          }
        });
      });
    }
  }
};

export const logout = () => (dispatch, getState) => {
  let userId = getState().data.user.id
  firebase.auth().signOut().then(function() {
    console.log(userId)
    firebase.database().ref('/people/' + userId).child('/loggedIn').set(false);
    dispatch({ type: LOGIN_USER, payload: false });
  }).catch(function(error) { console.log(error) });
}

export function stopLoading() {
  return function(dispatch) {
    dispatch({ type: LOADING, payload: false });
  }
}

export function uploadSelfie(upload) {
  return function(dispatch, getState) {
    let userId = getState().data.user.id

    // Storing in user folder in picture folder
    firebase.storage().ref(getState().exists.game + '/' + userId).put(upload)
      .then(function(snapshot) {
        firebase.storage().ref(getState().exists.game).child('/' + userId).getDownloadURL().then(function(selfieUrl) {
          firebase.database().ref(getState().exists.game + '/people/' + userId).child('selfieUrl').set(selfieUrl);
        }).catch(function(error) {console.log(error) });
      }).catch(function(error) {console.log(error) });
  }
}
export function enroll() {
  return function(dispatch, getState) {
    let userId = getState().data.user.id;
    firebase.database().ref(getState().exists.game + '/people/' + userId).child('enrolled').set(true);
  }
}
export function gameStatus(status) {
  return function(dispatch) {
    dispatch({ type: GAME_STATUS, payload: status });
  }
}
export function scoreStatus(score) {
  return function(dispatch) {
    dispatch({ type: SCORE_STATUS, payload: score });
  }
}
export function updateUser(user) {
  return function(dispatch) {
    dispatch({ type: UPDATE_USER, payload: user });
  }
}

export function startGame(start) {
  return function(dispatch, getState) {
    let { gameExists } = getState().general;

    // loading until gamestatus changed?
    dispatch({ type: LOADING, payload: true });
    let startGame = firebase.functions().httpsCallable('startgame');
    startGame({gameExists});
  }
}
export function stopGame() {
  return function(dispatch, getState) {
    let { gameExists } = getState().general;

    let stopGame = firebase.functions().httpsCallable('stopgame');
    stopGame({gameExists})
    dispatch({ type: GAME_STATUS, payload: false });
  }
}
export function iDied(uid) {
  return function(dispatch, getState) {
    let { gameExists } = getState().general

    let iDied = firebase.functions().httpsCallable('idied');
    iDied({gameExists});
    dispatch({ type: UPDATE_USER, payload: {alive: false} });
  }
}
