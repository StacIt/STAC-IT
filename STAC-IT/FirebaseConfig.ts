// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAajm6xMuPwyIugHSXFBVKVoDhe6B_aG0Y",
  authDomain: "stac-it.firebaseapp.com",
  projectId: "stac-it",
  storageBucket: "stac-it.appspot.com",
  messagingSenderId: "1061792458880",
  appId: "1:1061792458880:web:c1cc48310aa5d216241e65"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP)