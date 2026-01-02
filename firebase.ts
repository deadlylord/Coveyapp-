
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDA_kEfOhg3uRWCqWjruIJl6Un7ghxL98E",
  authDomain: "coveyapp.firebaseapp.com",
  projectId: "coveyapp",
  storageBucket: "coveyapp.firebasestorage.app",
  messagingSenderId: "912956113182",
  appId: "1:912956113182:web:b2cc026349f368e6de490f",
  measurementId: "G-NJP6CN9B7L"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
