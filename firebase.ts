
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDA_kEfOhg3uRWCqWjruIJl6Un7ghxL98E",
  authDomain: "coveyapp.firebaseapp.com",
  projectId: "coveyapp",
  storageBucket: "coveyapp.firebasestorage.app",
  messagingSenderId: "912956113182",
  appId: "1:912956113182:web:b2cc026349f368e6de490f",
  measurementId: "G-NJP6CN9B7L"
};

let db: any;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase init failed:", e);
    db = null;
}

export { db };
