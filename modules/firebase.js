import { initializeApp } from '../firebase/firebase-app.js';
import { getAuth } from '../firebase/firebase-auth.js';
import { getFirestore } from '../firebase/firebase-firestore.js';
import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
