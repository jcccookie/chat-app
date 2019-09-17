import * as firebase from "firebase/app";

import "firebase/auth";
import "firebase/database";
import "firebase/storage";

var firebaseConfig = {
   apiKey: "AIzaSyCgUCMmJKS29JRaNDx8H4xUH8zYIhNKAGc",
   authDomain: "slack-clone-e6a29.firebaseapp.com",
   databaseURL: "https://slack-clone-e6a29.firebaseio.com",
   projectId: "slack-clone-e6a29",
   storageBucket: "slack-clone-e6a29.appspot.com",
   messagingSenderId: "1097689018207",
   appId: "1:1097689018207:web:502d4da50340d6528250ea"
 };

 // Initialize Firebase
 firebase.initializeApp(firebaseConfig);

 export default firebase;