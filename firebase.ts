
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDA_kEfOhg3uRWCqWjruIJl6Un7ghxL98E",
  authDomain: "coveyapp.firebaseapp.com",
  projectId: "coveyapp",
  storageBucket: "coveyapp.firebasestorage.app",
  messagingSenderId: "912956113182",
  appId: "1:912956113182:web:f7a8afaf9b939e96de490f",
  measurementId: "G-9QKNFXN04B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

try {
    enableIndexedDbPersistence(db).catch((err) => {
        console.warn("Offline persistence failed", err.code);
    });
} catch (e) {}

export { db, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail };

export async function saveUserData(uid: string, data: any) {
    if (!uid) return false;
    try {
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(doc(db, "users", uid), {
            ...cleanData,
            lastSync: Date.now()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error("Cloud Sync Error:", e);
        return false;
    }
}

export async function loadUserData(uid: string) {
    if (!uid) return null;
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists()) return docSnap.data();
    } catch (e) {
        console.error("Cloud Load Error:", e);
    }
    return null;
}
