// Firebase configuration and initialization for InflyncedPuzzle
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDKBbxqu4uU6_wq1KPvv5yRuH6KaUqWWs",
  authDomain: "inflynced-puzzle.firebaseapp.com",
  projectId: "inflynced-puzzle",
  storageBucket: "inflynced-puzzle.firebasestorage.app",
  messagingSenderId: "299932878484",
  appId: "1:299932878484:web:b5609e70e0111786381681"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore database
export const db = getFirestore(app);

// Export the app instance
export default app;

// Log successful initialization
console.log('🔥 Firebase initialized successfully for InflyncedPuzzle');
