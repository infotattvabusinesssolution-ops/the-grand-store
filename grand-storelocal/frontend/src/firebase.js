import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBm8qZYrFWF3nsCA2YLZZoSv7vpg9t2ORQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "grand-store-65d7c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "grand-store-65d7c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "grand-store-65d7c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "153305069501",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:153305069501:web:121af3d74983e992aa04d4",
  measurementId: "G-PWHRS9NF9R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber };
export default app;
