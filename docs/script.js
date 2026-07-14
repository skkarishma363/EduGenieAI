/**
 * EduGenie — GitHub Pages Edition
 * --------------------------------
 * This script calls the Google Gemini REST API directly from the browser.
 * No backend server is required. Your API key is stored only in localStorage.
 *
 * Gemini REST endpoint:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
 */

// ─── DOM Elements ─────────────────────────────────────────────────────────────
const taskSelect      = document.getElementById('taskSelect');
const inputPrompt     = document.getElementById('inputPrompt');
const generateBtn     = document.getElementById('generateBtn');
const loader          = document.getElementById('loader');
const resultCard      = document.getElementById('resultCard');
const resultBody      = document.getElementById('resultBody');
const emptyStateCard  = document.getElementById('emptyStateCard');
const settingsBtn     = document.getElementById('settingsBtn');
const settingsModal   = document.getElementById('settingsModal');
const apiKeyInput     = document.getElementById('apiKeyInput');
const closeSettingsBtn= document.getElementById('closeSettingsBtn');
const saveKeyBtn      = document.getElementById('saveKeyBtn');
const clearKeyBtn     = document.getElementById('clearKeyBtn');
const togglePasswordBtn=document.getElementById('togglePasswordBtn');
const charCount       = document.getElementById('charCount');
const copyBtn         = document.getElementById('copyBtn');
const resultTitle     = document.getElementById('resultTitle');
const resultHeaderIcon= document.getElementById('resultHeaderIcon');

// ─── Constants ────────────────────────────────────────────────────────────────
const GEMINI_MODEL   = 'gemini-3.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── Task Configuration ───────────────────────────────────────────────────────
const taskConfigs = {
    question_answering: {
        placeholder: "Ask any educational question, e.g., 'How does the greenhouse effect work?' or 'Explain the difference between SQL and NoSQL databases.'",
        title: "Q&A Insight",
        icon: "fa-solid fa-question"
    },
    concept_explanation: {
        placeholder: "Enter a concept to explain, e.g., 'Quantum Entanglement', 'Photosynthesis', or 'Binary Search Algorithm'.",
        title: "Concept Explained",
        icon: "fa-solid fa-brain"
    },
    quiz_generation: {
        placeholder: "Enter a topic or paste study text to generate a 5-question quiz, e.g., 'Mitochondria structure and function' or 'Basic JavaScript loops.'",
        title: "Interactive Study Quiz",
        icon: "fa-solid fa-circle-question"
    },
    text_summarization: {
        placeholder: "Paste long educational articles, essays, or textbook chapters here to generate a TL;DR summary and key takeaways.",
        title: "Document Summary",
        icon: "fa-solid fa-file-contract"
    },
    learning_path: {
        placeholder: "Enter a subject or career path you want to learn, e.g., 'Full-Stack Web Development', 'Python for Data Science', or 'Linear Algebra.'",
        title: "Personalized Roadmap",
        icon: "fa-solid fa-route"
    }
};

// ─── Global State ─────────────────────────────────────────────────────────────
let rawContent = null;
let currentTaskType = 'question_answering';

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) apiKeyInput.value = savedKey;

    updateTextareaPlaceholder();

    taskSelect.addEventListener('change', handleTaskChange);
    inputPrompt.addEventListener('input', updateCharCount);
    generateBtn.addEventListener('click', handleGenerate);
    copyBtn.addEventListener('click', handleCopyContent);

    settingsBtn.addEventListener('click', openModal);
    closeSettingsBtn.addEventListener('click', closeModal);
    saveKeyBtn.addEventListener('click', saveApiKey);
    clearKeyBtn.addEventListener('click', clearApiKey);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal();
    });
});

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function updateTextareaPlaceholder() {
    const selected = taskSelect.value;
    currentTaskType = selected;
    inputPrompt.placeholder = taskConfigs[selected].placeholder;
    updateCharCount();
}

function handleTaskChange() { updateTextareaPlaceholder(); }

function updateCharCount() {
    const len = inputPrompt.value.length;
    charCount.textContent = `${len} character${len !== 1 ? 's' : ''}`;
}

function openModal()  { settingsModal.classList.remove('hidden'); }
function closeModal() { settingsModal.classList.add('hidden'); }

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        showToast('Gemini API Key saved successfully!', 'success');
        closeModal();
    } else {
        showToast('Please enter a valid key.', 'info');
    }
}

function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    apiKeyInput.value = '';
    showToast('Gemini API Key cleared.', 'info');
    closeModal();
}

function togglePasswordVisibility() {
    const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyInput.setAttribute('type', type);
    const icon = togglePasswordBtn.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// ─── Gemini API Call ──────────────────────────────────────────────────────────
async function callGemini(prompt, jsonMode = false) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error('No Gemini API key found. Please click the ⚙ Settings button and add your key from aistudio.google.com/apikey');
    }

    const url = `${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`;
    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...(jsonMode && { generationConfig: { responseMimeType: 'application/json' } })
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || `Gemini API error (${response.status})`;
        throw new Error(msg);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
}

// ─── Prompt Builders ─────────────────────────────────────────────────────────
function buildPrompt(task, userInput) {
    switch (task) {
        case 'question_answering':
            return (
                'You are an expert academic tutor. Answer the following question accurately. ' +
                'Your explanation must be written in beginner-friendly, simple English. ' +
                'Include concrete examples where appropriate. ' +
                'Use rich structured educational Markdown (headings, bold text, bullet points, code blocks).\n\n' +
                `Question: ${userInput}`
            );
        case 'concept_explanation':
            return (
                'You are an expert educator. Explain the following concept in beginner-friendly, simple English. ' +
                'Your response MUST contain these four sections with exact ## Markdown headers:\n\n' +
                '## Real-World Analogy\n' +
                'Explain using a simple, relatable real-world analogy.\n\n' +
                '## Key Concepts & Breakdowns\n' +
                'A bullet-point breakdown of the fundamental building blocks.\n\n' +
                '## Deep Dive\n' +
                'A detailed explanation of how it works. Include code, formulas, or step-by-step examples.\n\n' +
                '## Common Misconceptions\n' +
                'List 2-3 common misunderstandings about this concept.\n\n' +
                `Concept to explain: ${userInput}`
            );
        case 'text_summarization':
            return (
                'You are an academic summarizer. Summarize the following educational text. ' +
                'Your output must be formatted strictly in Markdown using these exact ## headers:\n\n' +
                '## Title\nGenerate a brief, clear, professional title.\n\n' +
                '## Short Summary\nWrite a concise beginner-friendly summary (1-3 sentences).\n\n' +
                '## Key Points\nList 3-5 critical arguments or facts as bullet points.\n\n' +
                `Text to summarize:\n\n${userInput}`
            );
        case 'quiz_generation':
            return (
                'Generate a multiple-choice quiz with EXACTLY 5 questions on the following topic. ' +
                'Return ONLY valid JSON matching this exact schema:\n' +
                '{"questions":[{"question":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A","explanation":"..."}]}\n' +
                'correct_answer must be exactly one letter: A, B, C, or D.\n\n' +
                `Topic: ${userInput}`
            );
        case 'learning_path':
            return (
                'You are an expert academic advisor. Create a personalized learning roadmap. ' +
                'Return ONLY valid JSON matching this exact schema:\n' +
                '{"roadmap_title":"...","overview":"...","beginner":{"phase_name":"Beginner Level","estimated_duration":"...","key_topics":["..."],"practice_projects":["..."],"recommended_resources":["..."]},' +
                '"intermediate":{"phase_name":"Intermediate Level","estimated_duration":"...","key_topics":["..."],"practice_projects":["..."],"recommended_resources":["..."]},' +
                '"advanced":{"phase_name":"Advanced Level","estimated_duration":"...","key_topics":["..."],"practice_projects":["..."],"recommended_resources":["..."]}}\n\n' +
                `Topic: ${userInput}`
            );
    }
}

// ─── Response Processors ─────────────────────────────────────────────────────
function processQuizResponse(jsonText) {
    let raw;
    try {
        // Strip markdown fences if present
        const cleaned = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        raw = JSON.parse(cleaned);
    } catch {
        throw new Error('Could not parse quiz JSON from Gemini. Please try again.');
    }

    const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
    const questions = (raw.questions || []).map(q => ({
        question: q.question || '',
        options: [q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || ''],
        correct_option_index: letterToIndex[(q.correct_answer || 'A').toUpperCase().trim()] ?? 0,
        explanation: q.explanation || ''
    }));

    return { type: 'quiz', content: { questions } };
}

function processLearningPathResponse(jsonText) {
    let raw;
    try {
        const cleaned = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        raw = JSON.parse(cleaned);
    } catch {
        throw new Error('Could not parse learning path JSON from Gemini. Please try again.');
    }

    const phases = [
        ['Beginner Level',     raw.beginner     || {}],
        ['Intermediate Level', raw.intermediate || {}],
        ['Advanced Level',     raw.advanced     || {}],
    ];

    const milestones = phases.map(([fallback, p]) => ({
        title:                   p.phase_name            || fallback,
        duration:                p.estimated_duration    || 'Varies',
        topics:                  p.key_topics            || [],
        practical_exercises:     p.practice_projects     || [],
        recommended_resources:   p.recommended_resources || [],
    }));

    return {
        type: 'learning_path',
        content: {
            roadmap_title: raw.roadmap_title || 'Learning Roadmap',
            overview:      raw.overview      || '',
            milestones,
        }
    };
}

// ─── Main Generate Handler ────────────────────────────────────────────────────
async function handleGenerate() {
    const promptText = inputPrompt.value.trim();
    const task = taskSelect.value;

    if (!promptText) {
        showToast('Please enter some prompt or text before generating.', 'error');
        return;
    }

    toggleLoadingState(true);

    try {
        const isJson = task === 'quiz_generation' || task === 'learning_path';
        const prompt = buildPrompt(task, promptText);
        const rawText = await callGemini(prompt, isJson);

        let result;
        if (task === 'quiz_generation') {
            result = processQuizResponse(rawText);
        } else if (task === 'learning_path') {
            result = processLearningPathResponse(rawText);
        } else {
            result = { type: 'markdown', content: rawText };
        }

        rawContent = result.content;
        renderResult(result.type, result.content);
        showToast('Learning materials generated successfully!', 'success');

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
        renderErrorState(err.message);
    } finally {
        toggleLoadingState(false);
    }
}

// ─── UI State ─────────────────────────────────────────────────────────────────
function toggleLoadingState(isLoading) {
    if (isLoading) {
        emptyStateCard.classList.add('hidden');
        resultCard.classList.remove('hidden');
        loader.classList.remove('hidden');
        resultBody.classList.add('hidden');
        generateBtn.disabled = true;
        generateBtn.querySelector('.btn-text').textContent = 'Thinking...';
        generateBtn.querySelector('.btn-icon i').className = 'fa-solid fa-circle-notch fa-spin';
    } else {
        loader.classList.add('hidden');
        resultBody.classList.remove('hidden');
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = 'Generate Learning Insights';
        generateBtn.querySelector('.btn-icon i').className = 'fa-solid fa-wand-magic-sparkles';
    }
}

function renderErrorState(errorMessage) {
    resultBody.innerHTML = `
        <div class="empty-state-content" style="padding:2rem 0;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;color:var(--incorrect-color);margin-bottom:1rem;"></i>
            <h4 style="font-family:var(--font-heading);font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;">Generation Failed</h4>
            <p style="color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(errorMessage)}</p>
        </div>
    `;
    resultTitle.textContent = 'Error — ' + taskConfigs[currentTaskType].title;
}

// ─── Result Renderers ─────────────────────────────────────────────────────────
function renderResult(type, content) {
    const config = taskConfigs[currentTaskType];
    resultTitle.textContent = config.title;
    resultHeaderIcon.innerHTML = `<i class="${config.icon}"></i>`;

    if (type === 'markdown')       renderMarkdown(content);
    else if (type === 'quiz')      renderQuiz(content);
    else if (type === 'learning_path') renderLearningPath(content);
}

function renderMarkdown(content) {
    resultBody.innerHTML = `<div class="markdown-body">${marked.parse(content)}</div>`;
}

function renderQuiz(quizData) {
    if (!quizData?.questions?.length) {
        resultBody.innerHTML = `<p>Error: No quiz questions were generated.</p>`;
        return;
    }

    let html = `<div class="quiz-container">`;
    quizData.questions.forEach((q, qIndex) => {
        const markers = ['A', 'B', 'C', 'D'];
        html += `
            <div class="quiz-card" id="q-card-${qIndex}">
                <div class="quiz-q-num">Question ${qIndex + 1}</div>
                <div class="quiz-question">${escapeHtml(q.question)}</div>
                <div class="quiz-options">
        `;
        q.options.forEach((opt, optIndex) => {
            html += `
                <button class="quiz-option"
                        onclick="handleQuizSelection(${qIndex},${optIndex},${q.correct_option_index},'${encodeURIComponent(q.explanation)}')">
                    <span class="quiz-option-marker">${markers[optIndex]}</span>
                    <span class="quiz-option-text">${escapeHtml(opt)}</span>
                </button>
            `;
        });
        html += `
                </div>
                <div class="quiz-explanation hidden" id="explanation-${qIndex}">
                    <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    resultBody.innerHTML = html;
}

window.handleQuizSelection = function(qIndex, selectedIndex, correctIndex, explanationEncoded) {
    const qCard = document.getElementById(`q-card-${qIndex}`);
    const options = qCard.querySelectorAll('.quiz-option');
    const explanationDiv = document.getElementById(`explanation-${qIndex}`);

    options.forEach((btn, idx) => {
        btn.disabled = true;
        btn.removeAttribute('onclick');
        if (idx === correctIndex) btn.classList.add('correct');
        else if (idx === selectedIndex) btn.classList.add('incorrect');
    });
    explanationDiv.classList.remove('hidden');
};

function renderLearningPath(roadmapData) {
    if (!roadmapData?.milestones?.length) {
        resultBody.innerHTML = `<p>Error: Could not render learning roadmap.</p>`;
        return;
    }

    let html = `
        <div class="roadmap-container">
            <div class="roadmap-header-info">
                <h4 class="roadmap-title">${escapeHtml(roadmapData.roadmap_title)}</h4>
                <p class="roadmap-overview">${escapeHtml(roadmapData.overview)}</p>
            </div>
            <div class="timeline">
    `;

    roadmapData.milestones.forEach((milestone, index) => {
        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                    <div class="timeline-card-header">
                        <h4 class="timeline-card-title">${index + 1}. ${escapeHtml(milestone.title)}</h4>
                        <span class="timeline-card-duration">${escapeHtml(milestone.duration)}</span>
                    </div>
                    <div class="timeline-card-body">
                        <div>
                            <div class="timeline-section-title">Core Topics</div>
                            <ul class="timeline-list">
                                ${milestone.topics.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <div class="timeline-section-title">Practical Exercises</div>
                            <ul class="timeline-list timeline-exercises">
                                ${milestone.practical_exercises.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <div class="timeline-section-title">Recommended Study Resources</div>
                            <ul class="timeline-list timeline-resources">
                                ${milestone.recommended_resources.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    resultBody.innerHTML = html;
}

// ─── Clipboard ────────────────────────────────────────────────────────────────
function handleCopyContent() {
    if (!rawContent) { showToast('No content available to copy.', 'error'); return; }

    let text = '';
    if (['question_answering', 'concept_explanation', 'text_summarization'].includes(currentTaskType)) {
        text = rawContent;
    } else if (currentTaskType === 'quiz_generation') {
        text = 'EduGenie - Generated Quiz\n\n';
        rawContent.questions.forEach((q, i) => {
            text += `Q${i + 1}: ${q.question}\n`;
            q.options.forEach((o, oi) => { text += `  ${'ABCD'[oi]}. ${o}\n`; });
            text += `Correct: Option ${q.correct_option_index + 1}\nExplanation: ${q.explanation}\n\n`;
        });
    } else if (currentTaskType === 'learning_path') {
        text = `EduGenie - Learning Path: ${rawContent.roadmap_title}\nOverview: ${rawContent.overview}\n\n`;
        rawContent.milestones.forEach((m, i) => {
            text += `${i + 1}. ${m.title} (${m.duration})\n`;
            text += `   Topics: ${m.topics.join(', ')}\n`;
            text += `   Exercises: ${m.practical_exercises.join(', ')}\n`;
            text += `   Resources: ${m.recommended_resources.join(', ')}\n\n`;
        });
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Insights copied to clipboard!', 'success');
        copyBtn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--correct-color)"></i>`;
        setTimeout(() => { copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`; }, 2000);
    }).catch(err => { showToast('Could not copy: ' + err.message, 'error'); });
}

// ─── Toast System ─────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error')   icon = 'fa-triangle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><div class="toast-message">${escapeHtml(message)}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    if (typeof text !== 'string') return String(text ?? '');
    return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
