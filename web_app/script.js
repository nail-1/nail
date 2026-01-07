document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const WRONG_KEY = 'nail_test_wrong_indexes';
    let wrongIndexes = JSON.parse(localStorage.getItem(WRONG_KEY) || '[]');
    let currentMode = 'ALL'; // 'ALL' or 'MISTAKE'
    let currentQuestions = [];
    let currentIndex = 0;

    // User answers for the current session
    let sessionAnswers = [];

    // --- Elements ---
    // Screens
    const homeScreen = document.getElementById('home-screen');
    const quizSection = document.getElementById('quiz-section');
    const resultContainer = document.getElementById('result-container');
    const quizContainer = document.getElementById('quiz-container');

    // Menu Elements
    const totalCountSpan = document.getElementById('total-count');
    const mistakeCountSpan = document.getElementById('mistake-count');
    const startBtn = document.getElementById('start-btn');
    const randomBtn = document.getElementById('random-btn');
    const reviewBtn = document.getElementById('review-btn');

    // Quiz Elements
    const progressBar = document.getElementById('progress-bar');
    const currentQSpan = document.getElementById('current-q');
    const totalQSpan = document.getElementById('total-q');
    const scoreTotalSpan = document.getElementById('score-total');
    // const qImage = document.getElementById('q-image'); // Removed
    const optionsContainer = document.getElementById('options');
    const optionBtns = document.querySelectorAll('.option-btn');
    const feedbackMsg = document.getElementById('feedback-msg');

    // Navigation
    const footerNav = document.getElementById('footer-nav');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const backBtn = document.getElementById('back-btn');

    // Result
    const scoreSpan = document.getElementById('score');
    const answerSummary = document.getElementById('answer-summary');

    // --- Init ---
    updateHomeCounts();

    // --- Event Listeners: Menu ---
    startBtn.addEventListener('click', () => {
        startQuiz('ALL');
    });

    randomBtn.addEventListener('click', () => {
        startQuiz('RANDOM');
    });

    reviewBtn.addEventListener('click', () => {
        if (wrongIndexes.length === 0) {
            alert("暂时没有错题记录！加油！");
            return;
        }
        startQuiz('MISTAKE');
    });

    // --- Event Listeners: Quiz ---
    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedVal = btn.dataset.value;
            // Record answer
            sessionAnswers[currentIndex] = selectedVal;

            // UI Selection
            optionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Feedback & Logic
            const currentQ = currentQuestions[currentIndex];
            const isCorrect = checkAnswerLogic(selectedVal, currentQ.answer);

            // Visual Feedback
            showFeedback(selectedVal, currentQ.answer);

            // Persistence Logic
            handlePersistence(currentIndex, isCorrect);

            // Auto-advance if correct
            if (isCorrect) {
                setTimeout(() => {
                    if (currentIndex < currentQuestions.length - 1) {
                        currentIndex++;
                        renderQuestion(currentIndex);
                    } else {
                        finishQuiz();
                    }
                }, 800); // 0.8 second delay to show feedback
            }
        });
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestion(currentIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < currentQuestions.length - 1) {
            currentIndex++;
            renderQuestion(currentIndex);
        } else {
            finishQuiz();
        }
    });

    restartBtn.addEventListener('click', () => {
        returnToHome();
    });

    backBtn.addEventListener('click', () => {
        returnToHome();
    });

    // --- Functions ---

    function updateHomeCounts() {
        totalCountSpan.textContent = questions.length;
        mistakeCountSpan.textContent = wrongIndexes.length;
    }

    function returnToHome() {
        updateHomeCounts();
        homeScreen.classList.remove('hidden');
        quizSection.classList.add('hidden');
        resultContainer.classList.add('hidden');
        footerNav.classList.add('hidden');
        backBtn.classList.add('hidden');
    }

    function startQuiz(mode) {
        currentMode = mode;
        if (mode === 'ALL') {
            currentQuestions = [...questions]; // Copy array
        } else if (mode === 'RANDOM') {
            // Shuffle questions
            currentQuestions = [...questions];
            for (let i = currentQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentQuestions[i], currentQuestions[j]] = [currentQuestions[j], currentQuestions[i]];
            }
        } else {
            // MISTAKE mode - Filter questions by their original index
            currentQuestions = wrongIndexes.map(idx => questions[idx]).filter(q => q !== undefined);
        }

        // Reset Session
        currentIndex = 0;
        sessionAnswers = new Array(currentQuestions.length).fill(null);

        // Show UI
        homeScreen.classList.add('hidden');
        quizSection.classList.remove('hidden');
        quizContainer.classList.remove('hidden'); // Ensure container is shown (might be hidden by result)
        resultContainer.classList.add('hidden');
        footerNav.classList.remove('hidden');

        // Render
        totalQSpan.textContent = currentQuestions.length;
        renderQuestion(0);

        // Show back button
        backBtn.classList.remove('hidden');
    }

    function renderQuestion(index) {
        const q = currentQuestions[index];

        // Update Progress
        const progress = ((index + 1) / currentQuestions.length) * 100;
        progressBar.style.width = `${progress}%`;

        // Update Info
        currentQSpan.textContent = index + 1;

        // Update Text
        document.getElementById('q-text').textContent = q.text;

        // Reset UI
        optionBtns.forEach(btn => {
            btn.classList.remove('selected', 'correct', 'wrong');
        });
        feedbackMsg.textContent = '';
        feedbackMsg.style.color = 'inherit';

        // Check if previously answered in this session
        const savedAnswer = sessionAnswers[index];
        if (savedAnswer) {
            optionBtns.forEach(btn => {
                if (btn.dataset.value === savedAnswer) {
                    btn.classList.add('selected');
                }
            });
            showFeedback(savedAnswer, q.answer);
        }

        // Update Nav Buttons
        prevBtn.disabled = index === 0;
        if (index === currentQuestions.length - 1) {
            nextBtn.textContent = "提交";
        } else {
            nextBtn.textContent = "下一题";
        }
    }

    function checkAnswerLogic(selected, correct) {
        if (!correct) return false;
        return selected === correct;
    }

    function showFeedback(selectedVal, correctVal) {
        if (!correctVal) {
            feedbackMsg.textContent = "已记录您的选择 (原题未提供标准答案)";
            feedbackMsg.style.color = "#666";
            return;
        }

        optionBtns.forEach(btn => {
            if (btn.dataset.value === correctVal) {
                btn.classList.add('correct');
            }
            if (btn.dataset.value === selectedVal && selectedVal !== correctVal) {
                btn.classList.add('wrong');
            }
        });

        if (selectedVal === correctVal) {
            feedbackMsg.textContent = "回答正确! ✅";
            feedbackMsg.style.color = "var(--success-color)";
        } else {
            feedbackMsg.textContent = `回答错误 ❌ 正确答案是: ${correctVal}`;
            feedbackMsg.style.color = "var(--error-color)";
        }
    }

    function handlePersistence(questionIndex, isCorrect) {
        // Use actual question index from the questions array
        let actualIndex = questionIndex;

        // For ALL/RANDOM mode, currentQuestions[questionIndex] is correct
        // We need to find the original index in the full questions array
        if (currentMode !== 'MISTAKE') {
            const currentQ = currentQuestions[questionIndex];
            actualIndex = questions.indexOf(currentQ);
        } else {
            // In MISTAKE mode, get the original index from wrongIndexes
            actualIndex = wrongIndexes[questionIndex];
        }

        if (actualIndex === -1) return;

        if (!isCorrect) {
            if (!wrongIndexes.includes(actualIndex)) {
                wrongIndexes.push(actualIndex);
            }
        } else {
            // Remove from wrongIndexes if it exists
            wrongIndexes = wrongIndexes.filter(idx => idx !== actualIndex);
        }

        // Save
        localStorage.setItem(WRONG_KEY, JSON.stringify(wrongIndexes));
    }

    function finishQuiz() {
        quizContainer.classList.add('hidden');
        footerNav.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        progressBar.style.width = '100%';

        // Calculate Score
        let score = 0;
        let summaryHtml = '<h3>答题详情:</h3><ul style="list-style:none; padding:0; margin-top:10px;">';

        currentQuestions.forEach((q, i) => {
            const isCorrect = q.answer ? sessionAnswers[i] === q.answer : false;
            if (isCorrect) score++;

            summaryHtml += `
                <li style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                    <span>题 ${i + 1}</span>
                    <span style="color: ${sessionAnswers[i] ? '#333' : '#999'}">
                        选: ${sessionAnswers[i] || '-'} 
                        ${q.answer ? (isCorrect ? '✅' : `❌ (对: ${q.answer})`) : '(暂无答案)'}
                    </span>
                </li>
            `;
        });
        summaryHtml += '</ul>';

        scoreSpan.textContent = score;
        scoreTotalSpan.textContent = currentQuestions.length;
        answerSummary.innerHTML = summaryHtml;
    }
});
