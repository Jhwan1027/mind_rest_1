import { doLogout, changeDisplayName, changePassword, deleteAccount, authErrMsg } from './auth.js';
import { getPrefs, savePrefs } from './db.js';
import { applyTheme } from './ui.js';
import { state } from './state.js';

export function renderSettingsPage() {
  if (!state.currentUser) return;
  const u = state.currentUser;
  const initial = (u.displayName || u.email).charAt(0).toUpperCase();
  document.getElementById('settings-avatar').textContent        = initial;
  document.getElementById('settings-displayname').textContent   = u.displayName || '';
  document.getElementById('settings-username-display').textContent = u.email;
  document.getElementById('settings-name-input').value  = '';
  document.getElementById('settings-cur-pw').value      = '';
  document.getElementById('settings-new-pw').value      = '';
  document.getElementById('settings-new-pw2').value     = '';
  ['settings-name-feedback','settings-pw-feedback'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = ''; el.className = 'settings-feedback';
  });
  getPrefs(u.uid).then(prefs => applyTheme(prefs.theme || 'dark'));
}

export function setupSettingsHandlers() {
  // 닉네임 변경
  document.getElementById('settings-name-btn').addEventListener('click', async () => {
    const val = document.getElementById('settings-name-input').value.trim();
    const fb  = document.getElementById('settings-name-feedback');
    fb.className = 'settings-feedback';
    if (!val)                            { fb.textContent='닉네임을 입력해주세요.';      fb.classList.add('error'); return; }
    if (val.length<1 || val.length>12)  { fb.textContent='닉네임은 1~12자로 입력해주세요.'; fb.classList.add('error'); return; }
    try {
      await changeDisplayName(val);
      state.currentUser = { ...state.currentUser, displayName: val };
      document.getElementById('settings-displayname').textContent = val;
      fb.textContent = '닉네임이 변경되었어요.'; fb.classList.add('success');
    } catch(e) {
      fb.textContent = authErrMsg(e.code); fb.classList.add('error');
    }
  });

  // 비밀번호 변경
  document.getElementById('settings-pw-btn').addEventListener('click', async () => {
    const cur  = document.getElementById('settings-cur-pw').value;
    const nw   = document.getElementById('settings-new-pw').value;
    const nw2  = document.getElementById('settings-new-pw2').value;
    const fb   = document.getElementById('settings-pw-feedback');
    fb.className = 'settings-feedback';
    if (!cur||!nw||!nw2) { fb.textContent='모든 항목을 입력해주세요.';   fb.classList.add('error'); return; }
    if (nw.length<6)     { fb.textContent='새 비밀번호는 6자 이상이어야 해요.'; fb.classList.add('error'); return; }
    if (nw!==nw2)        { fb.textContent='새 비밀번호가 일치하지 않아요.'; fb.classList.add('error'); return; }
    try {
      await changePassword(cur, nw);
      document.getElementById('settings-cur-pw').value = '';
      document.getElementById('settings-new-pw').value = '';
      document.getElementById('settings-new-pw2').value= '';
      fb.textContent='비밀번호가 변경되었어요.'; fb.classList.add('success');
    } catch(e) {
      fb.textContent=authErrMsg(e.code); fb.classList.add('error');
    }
  });

  // 테마 토글
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn;
      applyTheme(theme);
      if (state.currentUser)
        savePrefs(state.currentUser.uid, { theme });
    });
  });

  // 로그아웃
  document.getElementById('settings-logout-btn').addEventListener('click', async () => {
    if (!confirm('로그아웃 하시겠어요?')) return;
    await doLogout();
  });

  // 회원 탈퇴
  document.getElementById('settings-delete-btn').addEventListener('click', async () => {
    if (!confirm('정말 회원 탈퇴하시겠어요?\n모든 명상 기록이 함께 삭제됩니다.')) return;
    if (!confirm('마지막 확인입니다. 탈퇴하면 되돌릴 수 없어요.')) return;
    const pw = prompt('확인을 위해 현재 비밀번호를 입력해주세요.');
    if (!pw) return;
    try {
      await deleteAccount(pw);
    } catch(e) {
      alert(authErrMsg(e.code));
    }
  });
}
