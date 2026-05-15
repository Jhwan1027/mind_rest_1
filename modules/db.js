import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion
} from '../firebase/firebase-firestore.js';
import { db } from './firebase.js';

// ===== Sessions =====
export async function getSessions(uid) {
  try {
    const snap = await getDoc(doc(db, 'sessions', uid));
    return snap.exists() ? (snap.data().items || []) : [];
  } catch(e) { return []; }
}

export async function saveSession(uid, session) {
  const ref = doc(db, 'sessions', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { items: arrayUnion(session) });
  } else {
    await setDoc(ref, { items: [session] });
  }
}

export async function clearSessions(uid) {
  await setDoc(doc(db, 'sessions', uid), { items: [] });
}

// ===== Prefs =====
export async function getPrefs(uid) {
  try {
    const snap = await getDoc(doc(db, 'prefs', uid));
    return snap.exists() ? snap.data() : {};
  } catch(e) { return {}; }
}

export async function savePrefs(uid, prefs) {
  await setDoc(doc(db, 'prefs', uid), prefs, { merge: true });
}

export async function deletePrefs(uid) {
  try { await deleteDoc(doc(db, 'prefs', uid)); } catch(e) {}
}
