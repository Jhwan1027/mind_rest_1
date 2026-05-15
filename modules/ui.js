export const MOOD_EMOJI = ['', '😢', '😟', '😐', '😊', '😄'];

// ===== Loading / Auth Screen =====
export function showLoadingScreen() {
  document.getElementById('loading-screen').classList.remove('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
}

export function showAuthScreen() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
}

export function hideAuthScreen() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
}

// ===== Theme =====
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeBtn === theme);
  });
}

// ===== Navigation =====
export function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelector(`.nav-tab[data-page="${pageId}"]`).classList.add('active');
}

export function setupNavigation(goToFn) {
  document.querySelectorAll('.nav-tab').forEach(tab =>
    tab.addEventListener('click', () => goToFn(tab.dataset.page)));
  document.querySelectorAll('[data-goto]').forEach(el =>
    el.addEventListener('click', () => goToFn(el.dataset.goto)));
}

// ===== Completion Modal =====
export function showCompleteModal(type, minutes) {
  resetMoodPicker('modal-mood-after');
  document.getElementById('modal-desc').textContent =
    `${type} ${minutes}분을 완료했습니다.\n오늘도 수고하셨어요.`;
  document.getElementById('complete-modal').classList.remove('hidden');
}

export function hideCompleteModal() {
  document.getElementById('complete-modal').classList.add('hidden');
}

// ===== Mood Pickers =====
export function setupMoodPicker(pickerId, onSelect) {
  document.getElementById(pickerId).addEventListener('click', e => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;
    document.querySelectorAll(`#${pickerId} .mood-btn`)
      .forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    onSelect(Number(btn.dataset.val));
  });
}

export function resetMoodPicker(pickerId) {
  document.querySelectorAll(`#${pickerId} .mood-btn`)
    .forEach(b => b.classList.remove('selected'));
}
