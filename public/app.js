'use strict';

// ============================================================
// STATE
// ============================================================
let currentUserId = null;
let currentUserName = '';
let currentUserAge = null;
let quizAnswers = {};
let loadedQuestions = [];
let selectedGoals = [];
let lastResults = null;
let authToken = localStorage.getItem('authToken') || null;

// ============================================================
// DOM HELPERS
// ============================================================
function showLoading(msg) {
  const el = document.getElementById('loading-indicator');
  const txt = document.getElementById('loading-text');
  if (txt) txt.textContent = msg || 'Loading…';
  el.hidden = false;
}
function hideLoading() {
  document.getElementById('loading-indicator').hidden = true;
}
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.style.cssText = `
    padding: 1rem 1.5rem;
    margin-bottom: 0.75rem;
    border-radius: 10px;
    background: ${type === 'success' ? '#e8f5e9' : type === 'error' ? '#ffebee' : '#e3f2fd'};
    color: ${type === 'success' ? '#1b5e20' : type === 'error' ? '#b71c1c' : '#1565c0'};
    border-left: 4px solid ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1976d2'};
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 5000);
}
function showError(message) {
  showToast(message, 'error');
}
function hideError() {
  // Toast-based errors don't need explicit hiding
}
function showSection(id) {
  ['auth-section','goals-section','quiz-section','results-section'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.hidden = (s !== id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ============================================================
// AUTH TAB SWITCHING
// ============================================================
function switchTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const sections = ['login-form-section', 'register-form-section'];
  
  tabs.forEach(t => t.classList.remove('active'));
  sections.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.hidden = true;
  });
  
  if (tab === 'login') {
    document.getElementById('tab-login')?.classList.add('active');
    const el = document.getElementById('login-form-section');
    if (el) el.hidden = false;
  } else if (tab === 'register') {
    document.getElementById('tab-register')?.classList.add('active');
    const el = document.getElementById('register-form-section');
    if (el) el.hidden = false;
  }
}

// ============================================================
// PASSWORD TOGGLE
// ============================================================
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ============================================================
// FORGOT/RESET PASSWORD
// ============================================================
function showForgotPassword() {
  document.getElementById('login-form-section').hidden = true;
  document.getElementById('forgot-form-section').hidden = false;
}
function showLoginForm() {
  document.getElementById('forgot-form-section').hidden = true;
  document.getElementById('reset-form-section').hidden = true;
  document.getElementById('login-form-section').hidden = false;
}

// ============================================================
// LOGIN
// ============================================================
async function loginUser(formData) {
  const email = (formData.get('email') || '').trim();
  const password = (formData.get('password') || '').trim();
  
  if (!email) { showError('Please enter your email address.'); return; }
  if (!password) { showError('Please enter your password.'); return; }
  
  showLoading('Logging in…');
  hideError();
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { showError(data?.error || 'Invalid email or password.'); return; }
    if (!res.ok) { showError(data?.error || 'Login failed. Please try again.'); return; }
    
    // Store auth token
    authToken = data.token;
    localStorage.setItem('authToken', data.token);
    
    // Set user info
    currentUserId = data.userId;
    currentUserName = data.name;
    
    // Update header
    updateHeader();
    
    hideLoading();
    showToast(`Welcome back, ${data.name}! 👋`, 'success');
    
    // Show goals section
    showSection('goals-section');
  } catch (err) {
    showError('Cannot connect to server. Please check your connection.');
  } finally {
    hideLoading();
  }
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
  authToken = null;
  currentUserId = null;
  currentUserName = '';
  currentUserAge = null;
  quizAnswers = {};
  loadedQuestions = [];
  selectedGoals = [];
  lastResults = null;
  
  localStorage.removeItem('authToken');
  document.documentElement.setAttribute('data-theme', 'default');
  
  // Reset forms
  document.getElementById('login-form')?.reset();
  document.getElementById('register-form')?.reset();
  document.getElementById('forgot-form')?.reset();
  
  // Clear header
  const headerUser = document.getElementById('header-user');
  if (headerUser) headerUser.hidden = true;
  
  showToast('You have been logged out.', 'info');
  showSection('auth-section');
  switchTab('login');
}

// ============================================================
// FORGOT PASSWORD
// ============================================================
async function submitForgotPassword(formData) {
  const email = (formData.get('email') || '').trim();
  
  if (!email) { showError('Please enter your email address.'); return; }
  
  showLoading('Sending reset email…');
  hideError();
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showError(data?.error || 'Failed to send reset email.'); return; }
    
    hideLoading();
    showToast('Password reset email sent! Check your inbox.', 'success');
    
    // Show message and option to go back
    document.getElementById('forgot-form-section').innerHTML = `
      <button class="back-btn" onclick="showLoginForm()" style="margin-bottom: 1.5rem;">← Back to Login</button>
      <h2 class="auth-title">Check Your Email 📧</h2>
      <p class="auth-subtitle">We've sent a password reset link to ${escapeHtml(email)}</p>
      <div style="background: #e8f5e9; border-radius: 10px; padding: 1.5rem; text-align: center; color: #1b5e20;">
        <p style="margin-bottom: 1rem;">The link will expire in 1 hour.</p>
        <button class="btn btn--primary" onclick="showLoginForm()">Return to Login</button>
      </div>
    `;
  } catch (err) {
    showError('Cannot connect to server. Please check your connection.');
  } finally {
    hideLoading();
  }
}

// ============================================================
// RESET PASSWORD
// ============================================================
async function submitResetPassword(formData) {
  const password = (formData.get('password') || '').trim();
  
  if (!password) { showError('Please enter a new password.'); return; }
  if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('reset');
  
  if (!token) { showError('Invalid reset link. Please request a new one.'); return; }
  
  showLoading('Resetting password…');
  hideError();
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showError(data?.error || 'Failed to reset password.'); return; }
    
    hideLoading();
    showToast('Password reset successfully!', 'success');
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Show login form
    setTimeout(() => {
      document.getElementById('reset-form-section').hidden = true;
      switchTab('login');
    }, 500);
  } catch (err) {
    showError('Cannot connect to server. Please check your connection.');
  } finally {
    hideLoading();
  }
}

// ============================================================
// UPDATE HEADER
// ============================================================
function updateHeader() {
  const headerUser = document.getElementById('header-user');
  const headerGreeting = document.getElementById('header-greeting');
  
  if (currentUserName && headerUser) {
    headerGreeting.textContent = `Hey ${currentUserName}! 👋`;
    headerUser.hidden = false;
  }
}

// ============================================================
// GOAL SELECTION
// ============================================================
function toggleGoal(el) {
  el.classList.toggle('selected');
  selectedGoals = Array.from(document.querySelectorAll('.goal-card.selected')).map(c => c.dataset.goal);
}
function proceedToQuiz() {
  showSection('quiz-section');
  if (loadedQuestions.length === 0) loadQuestions();
}

// ============================================================
// REGISTRATION
// ============================================================
async function registerUser(formData) {
  const name = (formData.get('name') || '').trim();
  const email = (formData.get('email') || '').trim();
  const ageRaw = (formData.get('age') || '').trim();
  if (!name) { showError('Please enter your full name.'); return; }
  if (!email) { showError('Please enter your email address.'); return; }
  const payload = { name, email };
  if (ageRaw !== '') {
    const age = parseInt(ageRaw, 10);
    if (isNaN(age) || age < 10 || age > 100) { showError('Age must be between 10 and 100.'); return; }
    payload.age = age;
    currentUserAge = age;
  }
  showLoading('Creating your profile…');
  hideError();
  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) { showError('This email is already registered. Please login instead.'); return; }
    if (!res.ok) { showError(data?.details?.map(d=>d.msg).join(' ') || data?.error || 'Registration failed. Please try again.'); return; }
    
    // Store auth token
    authToken = data.token;
    localStorage.setItem('authToken', data.token);
    
    currentUserId = data.userId;
    currentUserName = name;
    if (ageRaw !== '') currentUserAge = parseInt(ageRaw, 10);
    
    updateHeader();
    hideLoading();
    showToast(`Welcome, ${name}! 🚀`, 'success');
    showSection('goals-section');
  } catch (err) {
    showError('Cannot connect to server. Please check your connection.');
  } finally {
    hideLoading();
  }
}

// ============================================================
// LOAD QUESTIONS
// ============================================================
async function loadQuestions() {
  showLoading('Loading your quiz…');
  try {
    const res = await fetch('/api/quiz/questions', { signal: AbortSignal.timeout(10000) });
    if (!res.ok) { showError('Failed to load questions. Please refresh.'); return; }
    const data = await res.json();
    loadedQuestions = data.questions || [];
    if (loadedQuestions.length === 0) { showError('No questions available. Please try again later.'); return; }
    renderQuestions(loadedQuestions);
    updateProgress();
  } catch (err) {
    showError('Cannot load questions. Please check your connection.');
  } finally {
    hideLoading();
  }
}

function renderQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  questions.forEach((q, i) => container.appendChild(createQuestionElement(q, i + 1)));
}

function createQuestionElement(question, num) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'question-item';
  fieldset.dataset.questionId = question._id;
  const legend = document.createElement('legend');
  legend.innerHTML = `<span class="question-number">Question ${num}</span><span class="question-text">${escapeHtml(question.text)}</span>`;
  fieldset.appendChild(legend);
  const ul = document.createElement('ul');
  ul.className = 'options-list';
  (question.options || []).forEach(opt => {
    const li = document.createElement('li');
    const radioId = `q_${question._id}_v_${opt.value}`;
    const label = document.createElement('label');
    label.className = 'option-label';
    label.htmlFor = radioId;
    const radio = document.createElement('input');
    radio.type = 'radio'; radio.id = radioId;
    radio.name = `question_${question._id}`;
    radio.value = opt.value; radio.className = 'option-radio';
    if (quizAnswers[question._id] === opt.value) radio.checked = true;
    radio.addEventListener('change', () => { quizAnswers[question._id] = opt.value; fieldset.classList.add('is-answered'); updateProgress(); });
    const span = document.createElement('span');
    span.className = 'option-text'; span.textContent = opt.label;
    label.appendChild(radio); label.appendChild(span);
    li.appendChild(label); ul.appendChild(li);
  });
  fieldset.appendChild(ul);
  return fieldset;
}

function updateProgress() {
  const total = loadedQuestions.length;
  const answered = Object.keys(quizAnswers).length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const fill = document.getElementById('quiz-progress');
  if (fill) fill.style.width = pct + '%';
  const lbl = document.getElementById('progress-label');
  if (lbl) lbl.textContent = `${answered} of ${total} answered`;
  const pctEl = document.getElementById('progress-percent');
  if (pctEl) pctEl.textContent = pct + '%';
  const btn = document.getElementById('submit-quiz-btn');
  const hint = document.getElementById('quiz-hint');
  if (btn) {
    const all = answered === total && total > 0;
    btn.disabled = !all;
    if (hint) hint.textContent = all ? 'All answered! Ready to discover your career path.' : `${total - answered} question${total - answered !== 1 ? 's' : ''} remaining.`;
  }
}

// ============================================================
// SUBMIT QUIZ
// ============================================================
async function submitAnswers() {
  if (!currentUserId) { showError('Session expired. Please register again.'); showSection('registration-section'); return; }
  const answers = Object.entries(quizAnswers).map(([questionId, selectedValue]) => ({ questionId, selectedValue }));
  if (answers.length === 0) { showError('Please answer at least one question.'); return; }
  showLoading('Analyzing your personality with AI…');
  hideError();
  try {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, answers }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) { showError('Session not found. Please register again.'); currentUserId = null; showSection('registration-section'); return; }
    if (!res.ok) { showError(data?.error || 'Submission failed. Please try again.'); return; }
    lastResults = data;
    hideLoading();
    displayResults(data);
    showSection('results-section');
  } catch (err) {
    showError('Cannot submit answers. Please check your connection.');
  } finally {
    hideLoading();
  }
}

// ============================================================
// BRAIN TYPE CLASSIFICATION
// ============================================================
function getBrainType(profile) {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = profile;
  const scores = [
    { type: 'Visionary',     emoji: '🔭', theme: 'visionary',    score: openness * 0.5 + extraversion * 0.3 + agreeableness * 0.2,     desc: 'You see possibilities others miss. You are imaginative, future-focused, and love big ideas.' },
    { type: 'Strategist',    emoji: '♟️', theme: 'strategist',   score: conscientiousness * 0.5 + openness * 0.3 + (100 - neuroticism) * 0.2, desc: 'You think several steps ahead. Analytical, disciplined, and goal-oriented.' },
    { type: 'Creator',       emoji: '🎨', theme: 'creator',      score: openness * 0.6 + agreeableness * 0.2 + extraversion * 0.2,     desc: 'You express yourself through innovation. Creative, expressive, and original.' },
    { type: 'Communicator',  emoji: '🗣️', theme: 'communicator', score: extraversion * 0.5 + agreeableness * 0.4 + openness * 0.1,     desc: 'You connect people and ideas. Charismatic, empathetic, and persuasive.' },
    { type: 'Logical Thinker', emoji: '🧮', theme: 'strategist', score: conscientiousness * 0.4 + (100 - neuroticism) * 0.3 + (100 - extraversion) * 0.3, desc: 'You rely on facts and data. Precise, methodical, and detail-oriented.' },
  ];
  return scores.sort((a, b) => b.score - a.score)[0];
}

// ============================================================
// HIDDEN STRENGTHS
// ============================================================
function getHiddenStrengths(profile) {
  const strengths = [];
  if (profile.openness > 60) strengths.push({ icon: '💡', title: 'Innovation', desc: 'You naturally generate creative solutions' });
  if (profile.agreeableness > 60) strengths.push({ icon: '❤️', title: 'Emotional Intelligence', desc: 'You read people and situations with ease' });
  if (profile.conscientiousness > 60) strengths.push({ icon: '🎯', title: 'Strategic Thinking', desc: 'You plan and execute with precision' });
  if (profile.extraversion > 60) strengths.push({ icon: '🌟', title: 'Natural Leadership', desc: 'People are drawn to your energy and confidence' });
  if (profile.neuroticism < 40) strengths.push({ icon: '🧘', title: 'Resilience', desc: 'You stay calm and bounce back from setbacks' });
  if (profile.openness > 50 && profile.agreeableness > 50) strengths.push({ icon: '🔄', title: 'Adaptability', desc: 'You thrive in changing environments' });
  if (strengths.length < 3) strengths.push({ icon: '⚡', title: 'Hidden Potential', desc: 'Your unique combination of traits creates untapped power' });
  return strengths.slice(0, 6);
}

// ============================================================
// DUAL PERSONALITY
// ============================================================
function getDualPersonality(profile) {
  const workTypes = [
    { min: 70, trait: 'conscientiousness', label: 'The Perfectionist', desc: 'Detail-focused, reliable, high standards' },
    { min: 70, trait: 'openness', label: 'The Innovator', desc: 'Brings fresh ideas, challenges the status quo' },
    { min: 70, trait: 'extraversion', label: 'The Driver', desc: 'Takes charge, motivates the team' },
    { min: 0, trait: 'conscientiousness', label: 'The Analytical', desc: 'Data-driven, methodical, thorough' },
  ];
  const socialTypes = [
    { min: 70, trait: 'extraversion', label: 'The Energizer', desc: 'Lights up the room, connects everyone' },
    { min: 70, trait: 'agreeableness', label: 'The Nurturer', desc: 'Supportive, warm, always there for others' },
    { min: 0, trait: 'extraversion', label: 'Introverted Leader', desc: 'Quiet strength, deep connections, thoughtful' },
    { min: 0, trait: 'agreeableness', label: 'The Independent', desc: 'Self-reliant, direct, values authenticity' },
  ];
  const work = workTypes.find(t => profile[t.trait] >= t.min) || workTypes[workTypes.length - 1];
  const social = socialTypes.find(t => profile[t.trait] >= t.min) || socialTypes[socialTypes.length - 1];
  return { work, social };
}

// ============================================================
// BURNOUT RISK
// ============================================================
function getBurnoutRisk(profile) {
  const risk = Math.round((profile.neuroticism * 0.5) + ((100 - profile.conscientiousness) * 0.3) + ((100 - profile.agreeableness) * 0.2));
  const capped = Math.min(100, Math.max(0, risk));
  let level, advice;
  if (capped < 35) { level = 'low'; advice = '✅ Low burnout risk! You handle stress well and maintain healthy boundaries. Keep up your self-care habits.'; }
  else if (capped < 65) { level = 'medium'; advice = '⚠️ Moderate burnout risk. Consider building stress management routines and setting clear work-life boundaries.'; }
  else { level = 'high'; advice = '🚨 High burnout risk detected. Prioritize rest, avoid overcommitting, and seek supportive work environments with clear structure.'; }
  return { risk: capped, level, advice };
}

// ============================================================
// FUTURE SELF PREDICTION
// ============================================================
function getFutureSelf(profile, topCareer, age) {
  const brainType = getBrainType(profile);
  const currentAge = age || 21;
  const futureAge = currentAge + 5;
  const salary = topCareer.matchScore > 85 ? '₹12–25 LPA' : topCareer.matchScore > 70 ? '₹8–15 LPA' : '₹5–10 LPA';
  const workStyle = profile.extraversion > 60 ? 'in a collaborative team environment' : 'in a focused, independent setup';
  const growth = profile.conscientiousness > 60 ? 'strong leadership and management skills' : profile.openness > 60 ? 'deep expertise and creative mastery' : 'solid technical and communication skills';
  const lifestyle = profile.extraversion > 60 ? 'active social life with strong professional network' : 'balanced lifestyle with deep personal relationships';
  const prediction = `At age ${futureAge}, you may become a ${brainType.type.toLowerCase()} ${escapeHtml(topCareer.title)} working ${workStyle}, having developed ${growth}.`;
  return { futureAge, prediction, salary, lifestyle, growth, workStyle };
}

// ============================================================
// GOAL ALIGNMENT
// ============================================================
function getGoalAlignment(careers, goals) {
  const goalCareerMap = {
    wealth:    ['Software Engineer','Data Scientist','Financial Analyst','Lawyer','Doctor / Physician'],
    stability: ['Civil Engineer','Doctor / Physician','Teacher / Educator','Financial Analyst'],
    creativity:['Graphic Designer','Teacher / Educator','Psychologist'],
    fame:      ['Lawyer','Doctor / Physician','Teacher / Educator'],
    freedom:   ['Software Engineer','Data Scientist','Graphic Designer'],
    impact:    ['Doctor / Physician','Psychologist','Teacher / Educator','Lawyer']
  };
  if (!goals || goals.length === 0) return null;
  const topCareer = careers[0]?.title || '';
  return goals.map(goal => {
    const aligned = goalCareerMap[goal] || [];
    const match = aligned.some(c => topCareer.includes(c.split(' ')[0])) ? 'yes' : careers.slice(0,3).some(c => aligned.some(a => c.title.includes(a.split(' ')[0]))) ? 'partial' : 'no';
    const icons = { wealth:'💰', stability:'🏠', creativity:'🎨', fame:'⭐', freedom:'🌍', impact:'❤️' };
    const labels = { wealth:'Wealth & High Income', stability:'Job Stability', creativity:'Creative Expression', fame:'Recognition & Fame', freedom:'Work Freedom', impact:'Social Impact' };
    return { goal, icon: icons[goal], label: labels[goal], match };
  });
}

// ============================================================
// ALTERNATE CAREER UNIVERSE
// ============================================================
function getAlternateUniverse(profile, topCareer) {
  const alternates = [
    { condition: p => p.openness > 70 && p.conscientiousness < 60, from: 'logic', to: 'creativity', career: 'Game Designer or Creative Director' },
    { condition: p => p.conscientiousness > 70 && p.extraversion < 50, from: 'structure', to: 'leadership', career: 'Research Scientist or Data Architect' },
    { condition: p => p.extraversion > 70 && p.agreeableness > 70, from: 'technical skills', to: 'people skills', career: 'Life Coach or HR Director' },
    { condition: p => p.openness > 60 && p.extraversion < 50, from: 'social interaction', to: 'deep focus', career: 'Author or Independent Researcher' },
    { condition: p => p.agreeableness > 70 && p.conscientiousness > 70, from: 'individual work', to: 'team leadership', career: 'School Principal or NGO Director' },
  ];
  const match = alternates.find(a => a.condition(profile));
  if (!match) return `If you channeled more of your ${profile.openness > 60 ? 'creativity' : 'analytical power'} into a different path, you might have thrived as an <strong>Entrepreneur or Startup Founder</strong> — building something entirely your own.`;
  return `If you focused more on <strong>${match.to}</strong> rather than ${match.from}, you might have succeeded as a <strong>${match.career}</strong> — a completely different but equally fulfilling path.`;
}

// ============================================================
// SUCCESS PROBABILITY
// ============================================================
function getSuccessProbability(careers) {
  return careers.slice(0, 5).map(c => ({
    title: c.title,
    prob: Math.min(99, Math.round(c.matchScore * 0.85 + 10))
  }));
}

// ============================================================
// SKILL GAP DETECTOR
// ============================================================
function getSkillGap(topCareer) {
  const skillMap = {
    'Software Engineer':   { have: ['Problem Solving','Logical Thinking'], need: ['Python/JavaScript','System Design','DSA'] },
    'Data Scientist':      { have: ['Analytical Thinking','Curiosity'], need: ['Python','Statistics','Machine Learning'] },
    'Doctor / Physician':  { have: ['Empathy','Decision Making'], need: ['Clinical Knowledge','Medical Procedures','Research'] },
    'Teacher / Educator':  { have: ['Communication','Patience'], need: ['Curriculum Design','Assessment Methods','EdTech Tools'] },
    'Graphic Designer':    { have: ['Creativity','Visual Sense'], need: ['Adobe Suite','Typography','UI/UX Principles'] },
    'Business Analyst':    { have: ['Analytical Thinking','Communication'], need: ['SQL','Excel/Power BI','Process Modeling'] },
    'Lawyer':              { have: ['Critical Thinking','Research'], need: ['Legal Writing','Case Analysis','Courtroom Skills'] },
    'Civil Engineer':      { have: ['Math','Spatial Thinking'], need: ['AutoCAD','Structural Analysis','Project Management'] },
    'Psychologist':        { have: ['Empathy','Active Listening'], need: ['Counseling Techniques','Research Methods','Assessment Tools'] },
    'Financial Analyst':   { have: ['Analytical Thinking','Attention to Detail'], need: ['Financial Modeling','Excel','CFA Concepts'] },
  };
  const key = Object.keys(skillMap).find(k => topCareer.includes(k.split(' ')[0]));
  return skillMap[key] || { have: ['Curiosity','Dedication'], need: ['Domain Knowledge','Technical Skills','Communication'] };
}

// ============================================================
// DISPLAY RESULTS — MAIN RENDERER
// ============================================================
function displayResults(data) {
  const { profile, careers } = data;
  const topCareer = careers[0] || { title: 'Unknown', matchScore: 0 };

  // 1. Brain Type + Dynamic Theme
  const brainType = getBrainType(profile);
  document.documentElement.setAttribute('data-theme', brainType.theme);
  const banner = document.getElementById('brain-type-banner');
  banner.innerHTML = `
    <span class="brain-type-emoji">${brainType.emoji}</span>
    <div class="brain-type-title">You are a ${brainType.type}</div>
    <div class="brain-type-subtitle">${brainType.desc}</div>
  `;

  // 2. Future Self
  const future = getFutureSelf(profile, topCareer, currentUserAge);
  document.getElementById('future-self-content').innerHTML = `
    <div class="future-self-box">
      <div class="future-self-age">🔮 Prediction for Age ${future.futureAge}</div>
      <div class="future-self-text">${future.prediction}</div>
      <div class="future-self-stats">
        <div class="future-stat"><span class="future-stat-icon">💰</span><span class="future-stat-label">Expected Salary</span><span class="future-stat-value">${future.salary}</span></div>
        <div class="future-stat"><span class="future-stat-icon">🏠</span><span class="future-stat-label">Lifestyle</span><span class="future-stat-value">${profile.extraversion > 60 ? 'Active & Social' : 'Balanced & Focused'}</span></div>
        <div class="future-stat"><span class="future-stat-icon">📈</span><span class="future-stat-label">Growth Path</span><span class="future-stat-value">${profile.conscientiousness > 60 ? 'Leadership Track' : 'Expert Track'}</span></div>
        <div class="future-stat"><span class="future-stat-icon">💻</span><span class="future-stat-label">Work Style</span><span class="future-stat-value">${profile.extraversion > 60 ? 'Team-Oriented' : 'Independent'}</span></div>
      </div>
    </div>`;

  // 3. Strength Cards
  const strengths = getHiddenStrengths(profile);
  document.getElementById('strength-cards').innerHTML = strengths.map((s, i) =>
    `<div class="strength-card" style="animation-delay:${i * 0.1}s">
      <span class="strength-card-icon">${s.icon}</span>
      <div class="strength-card-title">${s.title}</div>
      <div class="strength-card-desc">${s.desc}</div>
    </div>`).join('');

  // 4. Dual Personality
  const dual = getDualPersonality(profile);
  document.getElementById('dual-personality').innerHTML = `
    <div class="dual-card dual-card--work">
      <span class="dual-card-icon">💼</span>
      <div class="dual-card-area">At Work</div>
      <div class="dual-card-type">${dual.work.label}</div>
      <div class="dual-card-desc">${dual.work.desc}</div>
    </div>
    <div class="dual-card dual-card--social">
      <span class="dual-card-icon">🎭</span>
      <div class="dual-card-area">Socially</div>
      <div class="dual-card-type">${dual.social.label}</div>
      <div class="dual-card-desc">${dual.social.desc}</div>
    </div>`;

  // 5. Burnout Risk
  const burnout = getBurnoutRisk(profile);
  document.getElementById('burnout-content').innerHTML = `
    <div class="burnout-meter">
      <div class="burnout-label-row">
        <span class="burnout-label">Burnout Risk Level</span>
        <span class="burnout-value" style="color:${burnout.level==='low'?'#2e7d32':burnout.level==='medium'?'#e65100':'#b71c1c'}">${burnout.risk}% — ${burnout.level.toUpperCase()}</span>
      </div>
      <div class="burnout-track"><div class="burnout-fill burnout-fill--${burnout.level}" style="width:0%" id="burnout-fill-bar"></div></div>
    </div>
    <div class="burnout-advice burnout-advice--${burnout.level}">${burnout.advice}</div>`;
  setTimeout(() => { const b = document.getElementById('burnout-fill-bar'); if(b) b.style.width = burnout.risk + '%'; }, 100);

  // 6. Personality Trait Bars
  const traits = ['openness','conscientiousness','extraversion','agreeableness','neuroticism'];
  document.getElementById('personality-profile').innerHTML = traits.map(t => {
    const score = Math.round(profile[t] || 0);
    return `<div class="trait-item">
      <div class="trait-header"><span class="trait-name">${t.charAt(0).toUpperCase()+t.slice(1)}</span><span class="trait-score">${score}/100</span></div>
      <div class="trait-track"><div class="trait-fill trait-fill--${t}" style="width:0%" data-target="${score}"></div></div>
    </div>`;
  }).join('');
  setTimeout(() => { document.querySelectorAll('.trait-fill[data-target]').forEach(el => { el.style.width = el.dataset.target + '%'; }); }, 100);

  // 7. Career Heatmap
  document.getElementById('career-heatmap').innerHTML = careers.map((c, i) => {
    const score = Math.round(c.matchScore);
    const tier = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'low';
    const rankClass = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : 'other';
    return `<div class="heatmap-row">
      <div class="heatmap-rank heatmap-rank--${rankClass}">${i+1}</div>
      <div class="heatmap-info">
        <div class="heatmap-title">${escapeHtml(c.title)}</div>
        <div class="heatmap-bar-wrap">
          <div class="heatmap-track"><div class="heatmap-fill heatmap-fill--${tier}" style="width:0%" data-target="${score}"></div></div>
          <span class="heatmap-pct heatmap-pct--${tier}">${score}%</span>
        </div>
      </div>
    </div>`;
  }).join('');
  setTimeout(() => { document.querySelectorAll('.heatmap-fill[data-target]').forEach(el => { el.style.width = el.dataset.target + '%'; }); }, 150);

  // 8. Skill Gap
  const skillGap = getSkillGap(topCareer.title);
  document.getElementById('skill-gap').innerHTML = `
    <div class="skill-gap-career">Top Match: ${escapeHtml(topCareer.title)}</div>
    <div class="skill-tags">
      ${skillGap.have.map(s => `<span class="skill-tag skill-tag--have">✅ ${escapeHtml(s)}</span>`).join('')}
      ${skillGap.need.map(s => `<span class="skill-tag skill-tag--need">📚 ${escapeHtml(s)}</span>`).join('')}
    </div>
    <div class="skill-gap-legend"><span>✅ You likely have this</span><span>📚 Develop this skill</span></div>`;

  // 9. Goal Alignment
  const goalAlignment = getGoalAlignment(careers, selectedGoals);
  if (goalAlignment && goalAlignment.length > 0) {
    document.getElementById('goal-alignment-content').innerHTML = `
      <p style="color:var(--muted);font-size:0.9rem;margin-bottom:0.75rem">Based on your selected life goals and top career matches:</p>
      <div class="goal-alignment-list">
        ${goalAlignment.map(g => `<div class="goal-align-row">
          <span class="goal-align-icon">${g.icon}</span>
          <span class="goal-align-text">${g.label}</span>
          <span class="goal-align-match goal-align-match--${g.match}">${g.match === 'yes' ? '✅ Aligned' : g.match === 'partial' ? '⚡ Partial' : '❌ Misaligned'}</span>
        </div>`).join('')}
      </div>`;
  } else {
    document.getElementById('goal-alignment-card').hidden = true;
  }

  // 10. Alternate Universe
  document.getElementById('alternate-universe').innerHTML = `<div class="alternate-box">${getAlternateUniverse(profile, topCareer)}</div>`;

  // 11. Success Probability
  const probs = getSuccessProbability(careers);
  document.getElementById('success-probability').innerHTML = probs.map(p => `
    <div class="prob-row">
      <span class="prob-career">${escapeHtml(p.title)}</span>
      <div class="prob-track"><div class="prob-fill" style="width:0%" data-target="${p.prob}"></div></div>
      <span class="prob-pct">${p.prob}%</span>
    </div>`).join('');
  setTimeout(() => { document.querySelectorAll('.prob-fill[data-target]').forEach(el => { el.style.width = el.dataset.target + '%'; }); }, 200);
}

// ============================================================
// SHARE RESULTS
// ============================================================
function shareResults() {
  if (!lastResults) return;
  const top = lastResults.careers[0];
  const brain = getBrainType(lastResults.profile);
  const text = `🧭 Career Compass Results\n\n🧠 Brain Type: ${brain.type} ${brain.emoji}\n💼 Top Career: ${top.title} (${Math.round(top.matchScore)}% match)\n\nDiscover your career path at Career Compass!`;
  if (navigator.share) {
    navigator.share({ title: 'My Career Compass Results', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => { alert('Results copied to clipboard! Share it anywhere.'); }).catch(() => { alert(text); });
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  hideLoading();
  hideError();

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    loginUser(new FormData(e.target));
  });

  // Register form
  document.getElementById('register-form')?.addEventListener('submit', e => {
    e.preventDefault();
    registerUser(new FormData(e.target));
  });

  // Forgot password form
  document.getElementById('forgot-form')?.addEventListener('submit', e => {
    e.preventDefault();
    submitForgotPassword(new FormData(e.target));
  });

  // Reset password form
  document.getElementById('reset-form')?.addEventListener('submit', e => {
    e.preventDefault();
    submitResetPassword(new FormData(e.target));
  });

  document.getElementById('submit-quiz-btn')?.addEventListener('click', submitAnswers);

  document.getElementById('retake-btn')?.addEventListener('click', () => {
    currentUserId = null; currentUserName = ''; currentUserAge = null;
    quizAnswers = {}; loadedQuestions = []; selectedGoals = []; lastResults = null;
    document.getElementById('register-form')?.reset();
    document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
    document.documentElement.setAttribute('data-theme', 'default');
    showSection('auth-section');
    switchTab('login');
  });

  // Check if there's a reset token in URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('reset')) {
    document.getElementById('auth-section').hidden = false;
    document.getElementById('login-form-section').hidden = true;
    document.getElementById('register-form-section').hidden = true;
    document.getElementById('forgot-form-section').hidden = true;
    document.getElementById('reset-form-section').hidden = false;
  } else {
    // Show auth section by default
    showSection('auth-section');
    switchTab('login');
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .auth-tab {
    transition: all 0.3s ease;
  }
  .auth-tab.active {
    border-bottom-color: var(--accent);
    color: var(--accent);
  }
  .back-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
    transition: color 0.2s;
  }
  .back-btn:hover {
    color: var(--accent-light);
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
  }
  .link-btn:hover {
    color: var(--accent-light);
    text-decoration: underline;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text);
    cursor: pointer;
  }
  .form-input--short {
    max-width: 140px;
  }
  .input-with-toggle {
    position: relative;
    display: flex;
    align-items: center;
  }
  .input-with-toggle .form-input {
    flex: 1;
    padding-right: 2.5rem;
  }
  .password-toggle {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--muted);
    transition: color 0.2s;
  }
  .password-toggle:hover {
    color: var(--accent);
  }
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    color: var(--muted);
    font-size: 0.85rem;
  }
  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8eaf6;
  }
  .social-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .btn--social {
    background: #f5f5f5;
    color: var(--text);
    border: 1px solid #e0e0e0;
    width: 100%;
    gap: 0.75rem;
  }
  .btn--social:hover {
    background: #eeeeee;
  }
  .btn--google:hover {
    background: #f1f3f4;
  }
  .btn--github:hover {
    background: #f6f8fa;
  }
  .auth-switch {
    text-align: center;
    font-size: 0.9rem;
    color: var(--muted);
    margin-top: 1.5rem;
  }
  .form-row-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1rem 0 1.5rem;
  }
  .password-strength {
    margin-top: 0.5rem;
    height: 4px;
    border-radius: 999px;
    background: #e8eaf6;
    display: none;
  }
  .password-strength.show {
    display: block;
  }
  .btn--lg {
    padding: 1rem 1.75rem;
    font-size: 1.05rem;
  }
  .btn--full {
    width: 100%;
  }
`;
document.head.appendChild(style);
