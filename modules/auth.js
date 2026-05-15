import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from '../firebase/firebase-auth.js';
import { auth } from './firebase.js';
import { clearSessions, deletePrefs } from './db.js';

export function listenAuthState(onLogin, onLogout) {
  onAuthStateChanged(auth, user => {
    if (user) onLogin(user);
    else onLogout();
  });
}

export function authErrMsg(code) {
  const map = {
    'auth/email-already-in-use': '이미 사용 중인 이메일이에요.',
    'auth/invalid-email':        '이메일 형식이 올바르지 않아요.',
    'auth/weak-password':        '비밀번호는 6자 이상이어야 해요.',
    'auth/user-not-found':       '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/wrong-password':       '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/invalid-credential':   '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/too-many-requests':    '잠시 후 다시 시도해주세요.',
    'auth/requires-recent-login':'보안을 위해 다시 로그인해주세요.',
    'auth/network-request-failed':'네트워크 연결을 확인해주세요.',
  };
  return map[code] || '오류가 발생했어요. 다시 시도해주세요.';
}

export async function doSignup(email, displayName, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred.user;
}

export async function doLogin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function doLogout() {
  await signOut(auth);
}

export async function changeDisplayName(newName) {
  await updateProfile(auth.currentUser, { displayName: newName });
}

export async function changePassword(currentPw, newPw) {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, currentPw);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPw);
}

export async function deleteAccount(password) {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, cred);
  await Promise.all([clearSessions(user.uid), deletePrefs(user.uid)]);
  await deleteUser(user);
}
