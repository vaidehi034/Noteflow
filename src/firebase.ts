// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQb2cpxCR5-ku_IkOarQs7De8JtnN5OT0",
  authDomain: "noteflow-c5eed.firebaseapp.com",
  projectId: "noteflow-c5eed",
  storageBucket: "noteflow-c5eed.firebasestorage.app",
  messagingSenderId: "882253748479",
  appId: "1:882253748479:web:d4f3cbd0565b41d83594ca",
  measurementId: "G-8JQPH3NE9S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);