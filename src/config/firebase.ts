// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDwH61C4M9I1L8T26jBZw-EKlRIfBk6ijY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "biblioteca-86363.firebaseapp.com",
  projectId: "biblioteca-86363",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "biblioteca-86363.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "716558210323",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:716558210323:web:e6d7e5e6dfe781910c76e6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L1Y3KX5V96",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

export default app;

