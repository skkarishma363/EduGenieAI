// DOM Elements
const taskSelect = document.getElementById('taskSelect');
const inputPrompt = document.getElementById('inputPrompt');
const generateBtn = document.getElementById('generateBtn');
const loader = document.getElementById('loader');
const resultCard = document.getElementById('resultCard');
const resultBody = document.getElementById('resultBody');
const emptyStateCard = document.getElementById('emptyStateCard');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const clearKeyBtn = document.getElementById('clearKeyBtn');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const charCount = document.getElementById('charCount');
const copyBtn = document.getElementById('copyBtn');
const resultTitle = document.getElementById('resultTitle');
const resultHeaderIcon = document.getElementById('resultHeaderIcon');

// Task Configuration
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

// Global State
let rawContent = null;
let currentTaskType = 'question_answering';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Load Saved API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
    
    // Set Initial Placeholder & Setup UI
    updateTextareaPlaceholder();
    
    // Event Listeners
    taskSelect.addEventListener('change', handleTaskChange);
    inputPrompt.addEventListener('input', updateCharCount);
    generateBtn.addEventListener('click', handleGenerate);
    copyBtn.addEventListener('click', handleCopyContent);
    
    // Modal Event Listeners
    settingsBtn.addEventListener('click', openModal);
    closeSettingsBtn.addEventListener('click', closeModal);
    saveKeyBtn.addEventListener('click', saveApiKey);
    clearKeyBtn.addEventListener('click', clearApiKey);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    
    // Close modal on click outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal();
    });
});

// Update Textarea Placeholder and Character Count
function updateTextareaPlaceholder() {
    const selectedTask = taskSelect.value;
    currentTaskType = selectedTask;
    const config = taskConfigs[selectedTask];
    
    inputPrompt.placeholder = config.placeholder;
    updateCharCount();
}

function handleTaskChange() {
    updateTextareaPlaceholder();
}

function updateCharCount() {
    const textLength = inputPrompt.value.length;
    charCount.textContent = `${textLength} character${textLength !== 1 ? 's' : ''}`;
}

// Modal Handlers
function openModal() {
    settingsModal.classList.remove('hidden');
}

function closeModal() {
    settingsModal.classList.add('hidden');
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        showToast('Gemini API Key saved successfully!', 'success');
        closeModal();
    } else {
        showToast('Please enter a valid key or clear the existing one.', 'info');
    }
}

function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    apiKeyInput.value = '';
    showToast('Gemini API Key cleared. Server defaults will be used.', 'info');
    closeModal();
}

function togglePasswordVisibility() {
    const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyInput.setAttribute('type', type);
    const eyeIcon = togglePasswordBtn.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
}

// Generate Action
async function handleGenerate() {
    const promptText = inputPrompt.value.trim();
    const task = taskSelect.value;
    
    if (!promptText) {
        showToast('Please enter some prompt or text before generating.', 'error');
        return;
    }
    
    // Toggle Loading UI State
    toggleLoadingState(true);
    
    // API headers configuration
    const headers = {
        'Content-Type': 'application/json',
    };
    
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        headers['X-Gemini-API-Key'] = savedKey;
    }
    
    // Map tasks to their specific API endpoints
    const endpoints = {
        question_answering: '/qa',
        concept_explanation: '/explain',
        quiz_generation: '/quiz',
        text_summarization: '/summarize',
        learning_path: '/learn/recommendations'
    };
    
    const targetEndpoint = endpoints[task] || '/qa';
    
    try {
        const response = await fetch(targetEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                input_text: promptText
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate content. Please try again.');
        }
        
        rawContent = data.content;
        renderResult(data.type, data.content);
        showToast('Learning materials generated successfully!', 'success');
        
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
        renderErrorState(err.message);
    } finally {
        toggleLoadingState(false);
    }
};

// UI State Toggles
function toggleLoadingState(isLoading) {
    if (isLoading) {
        emptyStateCard.classList.add('hidden');
        resultCard.classList.remove('hidden');
        loader.classList.remove('hidden');
        resultBody.classList.add('hidden');
        generateBtn.disabled = true;
        generateBtn.querySelector('.btn-text').textContent = "Thinking...";
        generateBtn.querySelector('.btn-icon i').className = "fa-solid fa-circle-notch fa-spin";
    } else {
        loader.classList.add('hidden');
        resultBody.classList.remove('hidden');
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = "Generate Learning Insights";
        generateBtn.querySelector('.btn-icon i').className = "fa-solid fa-wand-magic-sparkles";
    }
}

function renderErrorState(errorMessage) {
    resultBody.innerHTML = `
        <div class="empty-state-content" style="padding: 2rem 0;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--incorrect-color); margin-bottom: 1rem;"></i>
            <h4 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">Generation Failed</h4>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${errorMessage}</p>
        </div>
    `;
    
    const config = taskConfigs[currentTaskType];
    resultTitle.textContent = "Error Generating " + config.title;
}

// Result Renderers
function renderResult(type, content) {
    const config = taskConfigs[currentTaskType];
    resultTitle.textContent = config.title;
    
    // Update Header Icon
    const iconClass = config.icon;
    resultHeaderIcon.innerHTML = `<i class="${iconClass}"></i>`;
    
    if (type === 'markdown') {
        renderMarkdown(content);
    } else if (type === 'quiz') {
        renderQuiz(content);
    } else if (type === 'learning_path') {
        renderLearningPath(content);
    }
}

// 1. Markdown Renderer
function renderMarkdown(content) {
    resultBody.innerHTML = `<div class="markdown-body">${marked.parse(content)}</div>`;
}

// 2. Interactive Quiz Renderer
function renderQuiz(quizData) {
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        resultBody.innerHTML = `<p>Error: No quiz questions were generated.</p>`;
        return;
    }
    
    let html = `<div class="quiz-container">`;
    
    quizData.questions.forEach((q, qIndex) => {
        const optionMarkers = ['A', 'B', 'C', 'D'];
        html += `
            <div class="quiz-card" id="q-card-${qIndex}">
                <div class="quiz-q-num">Question ${qIndex + 1}</div>
                <div class="quiz-question">${q.question}</div>
                <div class="quiz-options">
        `;
        
        q.options.forEach((opt, optIndex) => {
            html += `
                <button class="quiz-option" 
                        onclick="handleQuizSelection(${qIndex}, ${optIndex}, ${q.correct_option_index}, '${encodeURIComponent(q.explanation)}')">
                    <span class="quiz-option-marker">${optionMarkers[optIndex]}</span>
                    <span class="quiz-option-text">${escapeHtml(opt)}</span>
                </button>
            `;
        });
        
        html += `
                </div>
                <div class="quiz-explanation hidden" id="explanation-${qIndex}">
                    <strong>Explanation:</strong> ${q.explanation}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    resultBody.innerHTML = html;
}

// Global scope handler for interactive quizzes
window.handleQuizSelection = function(qIndex, selectedIndex, correctIndex, explanationEncoded) {
    const qCard = document.getElementById(`q-card-${qIndex}`);
    const options = qCard.querySelectorAll('.quiz-option');
    const explanationDiv = document.getElementById(`explanation-${qIndex}`);
    
    // Highlight choices
    options.forEach((optBtn, idx) => {
        // Disable option buttons after choosing
        optBtn.disabled = true;
        optBtn.removeAttribute('onclick');
        
        if (idx === correctIndex) {
            optBtn.classList.add('correct');
        } else if (idx === selectedIndex) {
            optBtn.classList.add('incorrect');
        }
    });
    
    // Reveal explanation
    explanationDiv.classList.remove('hidden');
};

// 3. Roadmap / Learning Path Renderer
function renderLearningPath(roadmapData) {
    if (!roadmapData || !roadmapData.milestones || roadmapData.milestones.length === 0) {
        resultBody.innerHTML = `<p>Error: Could not render learning roadmap.</p>`;
        return;
    }
    
    let html = `
        <div class="roadmap-container">
            <div class="roadmap-header-info">
                <h4 class="roadmap-title">${roadmapData.roadmap_title}</h4>
                <p class="roadmap-overview">${roadmapData.overview}</p>
            </div>
            <div class="timeline">
    `;
    
    roadmapData.milestones.forEach((milestone, index) => {
        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                    <div class="timeline-card-header">
                        <h4 class="timeline-card-title">${index + 1}. ${milestone.title}</h4>
                        <span class="timeline-card-duration">${milestone.duration}</span>
                    </div>
                    <div class="timeline-card-body">
                        <div>
                            <div class="timeline-section-title">Core Topics</div>
                            <ul class="timeline-list">
                                ${milestone.topics.map(topic => `<li>${escapeHtml(topic)}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div>
                            <div class="timeline-section-title">Practical Exercises</div>
                            <ul class="timeline-list timeline-exercises">
                                ${milestone.practical_exercises.map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div>
                            <div class="timeline-section-title">Recommended Study Resources</div>
                            <ul class="timeline-list timeline-resources">
                                ${milestone.recommended_resources.map(res => `<li>${escapeHtml(res)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    resultBody.innerHTML = html;
}

// Clipboard Action
function handleCopyContent() {
    if (!rawContent) {
        showToast('No content available to copy.', 'error');
        return;
    }
    
    let textToCopy = '';
    
    if (currentTaskType === 'question_answering' || currentTaskType === 'concept_explanation' || currentTaskType === 'text_summarization') {
        textToCopy = rawContent;
    } else if (currentTaskType === 'quiz_generation') {
        // Formatted copy format for quizzes
        textToCopy = `EduGenie - Generated Quiz\n\n`;
        rawContent.questions.forEach((q, index) => {
            textToCopy += `Q${index + 1}: ${q.question}\n`;
            q.options.forEach((opt, oIdx) => {
                const marker = ['A', 'B', 'C', 'D'][oIdx];
                textToCopy += `  ${marker}. ${opt}\n`;
            });
            textToCopy += `Correct Answer Index: Option ${q.correct_option_index + 1}\n`;
            textToCopy += `Explanation: ${q.explanation}\n\n`;
        });
    } else if (currentTaskType === 'learning_path') {
        // Formatted copy for roadmap
        textToCopy = `EduGenie - Learning Path: ${rawContent.roadmap_title}\n`;
        textToCopy += `Overview: ${rawContent.overview}\n\n`;
        rawContent.milestones.forEach((m, index) => {
            textToCopy += `${index + 1}. ${m.title} (${m.duration})\n`;
            textToCopy += `   Topics: ${m.topics.join(', ')}\n`;
            textToCopy += `   Practical Exercises: ${m.practical_exercises.join(', ')}\n`;
            textToCopy += `   Resources: ${m.recommended_resources.join(', ')}\n\n`;
        });
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Insights copied to clipboard!', 'success');
        copyBtn.innerHTML = `<i class="fa-solid fa-check" style="color: var(--correct-color)"></i>`;
        setTimeout(() => {
            copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
        }, 2000);
    }).catch(err => {
        showToast('Could not copy text: ' + err.message, 'error');
    });
}

// Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove toast
    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Helpers
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
