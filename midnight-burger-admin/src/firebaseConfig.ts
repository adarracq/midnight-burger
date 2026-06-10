import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCu1Vv2VVWMLKEKu7qgbdkn2jP8obmR8Qw",
    authDomain: "midnight-burger-23e86.firebaseapp.com",
    projectId: "midnight-burger-23e86",
    storageBucket: "midnight-burger-23e86.firebasestorage.app",
    messagingSenderId: "54901681143",
    appId: "1:54901681143:web:b2c9886c1b8a1caac11cf2",
    measurementId: "G-4WP8Y9C17D"
};

const app = initializeApp(firebaseConfig);

// L'authentification Web gère la persistance toute seule dans le navigateur
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);