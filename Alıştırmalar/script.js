// --- 1. API Ayarları ---
const API_KEY = "AIzaSyBsh44drO5JpfACJJcWefuFYS5gN3SOAWQ";

const classData = {
    "1": ["Rakamları Tanıyalım", "Nesne Sayma", "Toplama Giriş", "Çıkarma Giriş", "Geometrik Şekiller", "Örüntüler", "Paralarımız", "Zamanı Ölçme", "Uzamsal İlişkiler"],
    "2": ["İki Basamaklı Sayılar", "Eldeli Toplama", "Onluk Bozarak Çıkarma", "Çarpma İşlemi", "Bölme Giriş", "Kesirler", "Uzunluk Ölçme", "Sıvı Ölçme", "Çarpım Tablosu"],
    "3": ["Üç Basamaklı Sayılar", "Romen Rakamları", "Eldeli Toplama", "Onluk Bozarak Çıkarma", "Çarpma İşlemi", "Kısa Yoldan Bölme", "Birim Kesirler", "Alan Ölçme", "Çevre Hesaplama"],
    "4": ["Dört Basamaklı Sayılar", "Açı Türleri", "Kesir Toplama", "Ondalık Gösterim", "Zaman Dönüşümü", "Dikdörtgen Alanı", "Zihinden Çarpma", "Kalanlı Bölme", "Simetri"]
};

let currentLessonId = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let isQuizPassed = false; // Barajı geçip geçemediğini takip etmek için

const getFunSentence = (topic) => {
    const sentences = [
        "sırlarını keşfetmeye hazır mısın?", "ile harika bir maceraya atıl!", "dünyasında eğlenceli bir yolculuk seni bekliyor.",
        "konusunda ustalaşma zamanı!", "ile süper zekanı herkese göster!"
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
};

// Quiz Soruları Üretici (Fallback - İnternet yoksa)
const generateFallbackQuestions = (grade) => {
    const questions = [];
    const ops = grade == "1" ? ['+'] : grade == "2" ? ['+', '-'] : grade == "3" ? ['+', '-', '*'] : ['+', '-', '*', '/'];

    for (let i = 0; i < 10; i++) {
        const op = ops[Math.floor(Math.random() * ops.length)];
        let num1, num2, answer, explanation;

        switch (op) {
            case '+': num1 = Math.floor(Math.random() * 20) + 1; num2 = Math.floor(Math.random() * 20) + 1; answer = num1 + num2;
                explanation = `${num1} ile ${num2}'yi toplarsak ${answer} eder.`; break;
            case '-': num1 = Math.floor(Math.random() * 20) + 10; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 - num2;
                explanation = `${num1}'den ${num2} çıkarırsak geriye ${answer} kalır.`; break;
            case '*': num1 = Math.floor(Math.random() * 10) + 1; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 * num2;
                explanation = `${num1} tane ${num2}, ${answer} yapmaktadır.`; break;
            case '/': num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * 10) + 1); answer = num1 / num2;
                explanation = `${num1} sayısının içinde ${num2} sayısından tam ${answer} tane vardır.`; break;
        }

        const options = [answer];
        while (options.length < 4) {
            const wrongBase = answer + (Math.floor(Math.random() * 10) - 5);
            if (!options.includes(wrongBase) && wrongBase > 0) options.push(wrongBase);
        }

        options.sort(() => Math.random() - 0.5);

        questions.push({
            text: `${num1} ${op} ${num2} işleminin sonucu kaçtır?`,
            options: options,
            correctAnswer: answer,
            explanation: explanation
        });
    }
    return questions;
};

async function fetchQuestionsFromAI(topicName, grade) {
    const prompt = `Sen tatlı ve neşeli bir ilkokul matematik öğretmenisin. 
    Öğrencin ${grade}. sınıf öğrencisi. Konu: "${topicName}".
    Bana SADECE geçerli bir JSON array döndür. Kod bloğu KULLANMA.
    Bu konuyla ilgili tam 10 tane, çocukların seviyesine uygun çoktan seçmeli matematik test sorusu hazırla.
    
    JSON yapısı tam olarak şöyle olmalı (dizi içinde 10 obje):
    [
        {
            "text": "Soru 1 metni",
            "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3", "Seçenek 4"],
            "correctAnswer": "Doğru Seçenek Metni",
            "explanation": "Öğrenci yanlış cevapladığında ona hatasını anlatan, cesaret verici ve tatlı bir açıklama."
        }
    ]
    DİKKAT: correctAnswer alanı SADECE DOĞRU ŞIKKIN METNİYLE BİREBİR AYNI olmalıdır (Örneğin "Seçenek 2"). "A", "B" gibi harf koyma, options dizisinden doğru olanı aynen yaz. Toplam 10 obje üret.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (!response.ok || result.error) return null;

        let aiText = result.candidates[0].content.parts[0].text;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = aiText.indexOf('[');
        const lastBracket = aiText.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            aiText = aiText.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(aiText);
    } catch (error) {
        console.error("API Hatası:", error);
        return null;
    }
}

const generateTopics = () => {
    const grid = document.getElementById('topics-grid');
    const user = JSON.parse(localStorage.getItem('mathIslandUser'));
    const completedExercises = user?.completedExercises || [];

    grid.innerHTML = '';

    Object.keys(classData).forEach(grade => {
        classData[grade].forEach((topicName, index) => {
            const topicId = `g${grade}-t${index}`;
            const isDone = completedExercises.includes(topicId);
            const funSentence = getFunSentence(topicName);

            const card = document.createElement('div');
            card.setAttribute('data-grade', grade);
            card.id = topicId;
            card.style.display = 'none';

            card.className = `topic-card cursor-pointer p-6 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col justify-between min-h-[16rem] relative
                ${isDone ? 'bg-green-50 border-green-400 shadow-green-100' : 'bg-white border-blue-200 shadow-blue-100'}`;

            card.innerHTML = `
                <div class="${isDone ? 'bg-green-500' : 'bg-blue-500'} text-white text-xs font-black px-3 py-1 rounded-full shadow-sm w-max mb-4">${grade}. Sınıf</div>
                
                <div class="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border-2 border-yellow-300 shadow-md absolute -top-4 -right-4 z-20 transform rotate-2">
                     <span class="font-black ${isDone ? 'text-green-600' : 'text-yellow-600'} text-xs flex items-center">
                         ${isDone ? '<i class="fa-solid fa-sparkles mr-1"></i> Kazanıldı' : '<i class="fa-solid fa-star fa-bounce text-yellow-500 mr-1"></i> 10 ⭐'}
                     </span>
                </div>
                
                <h3 class="text-xl font-black text-gray-800 leading-tight mb-2 flex-grow">${topicName}</h3>
                
                <p class="text-xs font-bold ${isDone ? 'text-green-600' : 'text-blue-500'} mb-5 flex items-start">
                    ${isDone
                    ? '<i class="fa-solid fa-circle-check mt-0.5 mr-2 text-green-500"></i> Alıştırmayı başarıyla tamamladın!'
                    : `<i class="fa-solid fa-sparkles mt-0.5 mr-2"></i> ${topicName} ${funSentence}`
                }
                </p>
                
                <div class="mt-auto">
                    <div class="flex items-center justify-between border-t ${isDone ? 'border-green-200' : 'border-blue-50'} pt-4">
                        <span class="text-xs font-black ${isDone ? 'text-green-600' : 'text-blue-500'} uppercase">
                            ${isDone ? 'TEKRAR ÇÖZ' : 'TESTE BAŞLA'}
                        </span>
                        <div class="h-10 w-10 flex items-center justify-center rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-500'} text-white shadow-md transition-transform hover:rotate-12">
                            <i class="fa-solid ${isDone ? 'fa-pen' : 'fa-play'} text-sm"></i>
                        </div>
                    </div>
                </div>
            `;

            card.onclick = () => startLesson(topicId, topicName, grade);
            grid.appendChild(card);
        });
    });
};

const renderQuestion = () => {
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-counter').innerText = `Soru ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('quiz-question-text').innerText = q.text;

    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        const isSelected = userAnswers[currentQuestionIndex] === opt;

        btn.className = `w-full text-left p-4 rounded-2xl border-4 font-black text-lg transition-all transform hover:scale-105
            ${isSelected ? 'bg-blue-100 border-blue-500 text-blue-800 scale-105' : 'bg-white border-blue-100 text-gray-700 hover:border-blue-300'}`;

        btn.innerHTML = `<span class="bg-blue-50 text-blue-500 w-8 h-8 rounded-full inline-flex items-center justify-center mr-3 font-bold">${['A', 'B', 'C', 'D'][idx]}</span> ${opt}`;

        btn.onclick = () => {
            userAnswers[currentQuestionIndex] = opt;
            renderQuestion();
        };
        optionsContainer.appendChild(btn);
    });

    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const finishBtn = document.getElementById('finish-lesson-btn');

    if (currentQuestionIndex === 0) {
        prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
        prevBtn.disabled = true;
    } else {
        prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        prevBtn.disabled = false;
    }

    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
        finishBtn.innerHTML = `<i class="fa-solid fa-flag-checkered text-xl"></i> Sınavı Tamamla`;
    } else {
        nextBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    }
};

const showQuizResult = () => {
    let score = 0;
    let feedbackHTML = "";

    currentQuestions.forEach((q, i) => {
        if (userAnswers[i] === q.correctAnswer) {
            score++;
        } else {
            const uAnswer = userAnswers[i] !== null ? userAnswers[i] : "Boş";
            feedbackHTML += `
                <div class="bg-red-50 border-l-[10px] border-red-400 p-4 rounded-2xl mb-4 text-left shadow-sm">
                    <p class="font-black text-gray-800 text-lg mb-2 flex items-start">
                        <i class="fa-solid fa-circle-xmark text-red-500 mr-2 mt-1"></i> ${i + 1}. Soru: ${q.text}
                    </p>
                    <div class="flex flex-col md:flex-row gap-3 mb-3 text-sm">
                        <div class="bg-white px-3 py-2 rounded-xl border-2 border-red-100 font-bold text-gray-500 flex-1">
                            Senin Cevabın: <span class="line-through text-red-400 ml-1">${uAnswer}</span>
                        </div>
                        <div class="bg-green-50 px-3 py-2 rounded-xl border-2 border-green-200 font-bold text-gray-600 flex-1">
                            Doğru Cevap: <span class="text-green-600 font-black ml-1">${q.correctAnswer}</span>
                        </div>
                    </div>
                    <div class="bg-blue-50 p-3 rounded-xl border-2 border-blue-100 italic text-blue-700 text-sm font-bold">
                        <i class="fa-solid fa-lightbulb text-yellow-500 mr-1"></i> ${q.explanation}
                    </div>
                </div>
            `;
        }
    });

    document.getElementById('quiz-question-container').classList.add('hidden');
    const resultContainer = document.getElementById('quiz-result-container');
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('flex');

    document.getElementById('prev-question-btn').classList.add('hidden');
    document.getElementById('next-question-btn').classList.add('hidden');

    const finishBtn = document.getElementById('finish-lesson-btn');
    finishBtn.classList.remove('hidden');

    if (score >= 8) {
        // BARAJI GEÇTİ
        isQuizPassed = true;
        resultContainer.innerHTML = `
            <i class="fa-solid fa-trophy text-[6rem] text-yellow-400 mb-4 drop-shadow-md animate-bounce"></i>
            <h3 class="text-4xl font-black text-green-500 mb-2 mt-2">Harika İş Çıkardın!</h3>
            <p class="text-xl text-gray-600 font-bold mb-4 bg-green-50 px-6 py-2 rounded-full border-2 border-green-200">
                Sınavı <span class="text-green-600 font-black">${score}/10</span> doğru ile bitirdin.
            </p>
            ${feedbackHTML ? `<div class="w-full max-w-2xl mt-4"><h4 class="text-left font-black text-gray-600 mb-3 border-b-2 pb-2">Gözden Kaçanlar:</h4>${feedbackHTML}</div>` : ''}
        `;
        finishBtn.innerHTML = `<i class="fa-solid fa-star"></i> Yıldızları Al ve Kapat`;
        finishBtn.classList.replace('bg-red-500', 'bg-green-500');
        finishBtn.classList.replace('hover:bg-red-600', 'hover:bg-green-600');

        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#bfdbfe', '#f87171', '#4ade80'] });
        }
    } else {
        // BARAJI GEÇEMEDİ
        isQuizPassed = false;
        resultContainer.innerHTML = `
            <i class="fa-solid fa-face-frown text-[6rem] text-blue-400 mb-4 drop-shadow-md"></i>
            <h3 class="text-4xl font-black text-blue-500 mb-2 mt-2">Biraz Daha Pratik!</h3>
            <p class="text-xl text-gray-600 font-bold mb-4 bg-blue-50 px-6 py-2 rounded-full border-2 border-blue-200">
                Başarılı olmak için <span class="text-red-500 font-black">8 doğru</span> yapmalısın. Sen <span class="text-red-500 font-black">${score}</span> doğru yaptın.
            </p>
            <div class="w-full max-w-2xl mt-4"><h4 class="text-left font-black text-red-500 mb-3 border-b-2 border-red-200 pb-2">Hatalarına Göz At:</h4>${feedbackHTML}</div>
        `;
        finishBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Tekrar Dene`;

        // CSS Sınıflarını Geriye Döndür / Ayarla
        finishBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        finishBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }
};

window.startLesson = async (id, name, grade) => {
    currentLessonId = id;
    const nameDisplay = document.getElementById('lesson-name-display');
    if (nameDisplay) nameDisplay.innerText = name;

    const modal = document.getElementById('lesson-modal');

    currentQuestions = [];
    currentQuestionIndex = 0;
    userAnswers = new Array(10).fill(null);
    isQuizPassed = false;

    document.getElementById('quiz-question-container').classList.remove('hidden');
    document.getElementById('quiz-result-container').classList.add('hidden');
    document.getElementById('quiz-result-container').classList.remove('flex');
    document.getElementById('quiz-result-container').innerHTML = ''; // Reset details

    const prevBtn = document.getElementById('prev-question-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const finishBtn = document.getElementById('finish-lesson-btn');

    prevBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    finishBtn.classList.add('hidden');
    finishBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    finishBtn.classList.add('bg-green-500', 'hover:bg-green-600');

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const oldSymbols = modal.querySelectorAll('.magic-bg-symbols');
        oldSymbols.forEach(el => el.remove());

        const symbolsHTML = `
            <div class="magic-bg-symbols fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <i class="magic-symbol fa-solid fa-plus text-7xl text-blue-300 opacity-60" style="top: 10%; left: 5%; animation-duration: 12s;"></i>
                <i class="magic-symbol fa-solid fa-minus text-6xl text-purple-300 opacity-60" style="top: 50%; left: 8%; animation-duration: 15s;"></i>
                <i class="magic-symbol fa-solid fa-xmark text-8xl text-green-300 opacity-50" style="bottom: 10%; left: 15%; animation-duration: 10s;"></i>
                <i class="magic-symbol fa-solid fa-divide text-[8rem] text-pink-300 opacity-40" style="top: 15%; right: 5%; animation-duration: 14s;"></i>
                <i class="magic-symbol fa-solid fa-equals text-7xl text-yellow-300 opacity-70" style="bottom: 20%; right: 10%; animation-duration: 11s;"></i>
                <i class="magic-symbol fa-solid fa-shapes text-[6rem] text-blue-200 opacity-50" style="top: 70%; right: 2%; animation-duration: 16s;"></i>
                <i class="magic-symbol fa-solid fa-star text-5xl text-yellow-400 opacity-80" style="top: 5%; right: 40%; animation-duration: 9s;"></i>
            </div>
        `;
        modal.insertAdjacentHTML('afterbegin', symbolsHTML);
    }

    const questionText = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');

    questionText.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-blue-300 animate-pulse mr-2"></i> Büyülü Sorular Hazırlanıyor...`;
    optionsContainer.innerHTML = '';
    document.getElementById('question-counter').innerText = 'Sorular Yükleniyor';
    prevBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');

    try {
        let aiQuestions = await fetchQuestionsFromAI(name, grade);
        if (aiQuestions && aiQuestions.length === 10) {
            currentQuestions = aiQuestions;
        } else {
            currentQuestions = generateFallbackQuestions(grade);
        }
    } catch (e) {
        currentQuestions = generateFallbackQuestions(grade);
    }

    prevBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');

    renderQuestion();
};

window.closeLessonModal = () => {
    const modal = document.getElementById('lesson-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        const oldSymbols = modal.querySelectorAll('.magic-bg-symbols');
        oldSymbols.forEach(el => el.remove());
    }
    currentLessonId = null;
};

// --- Filtreleme ---
window.filterGrade = (grade) => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active-filter', 'bg-white', 'text-blue-600', 'border-blue-300');
        btn.classList.add('text-gray-400', 'border-gray-100');
    });

    const activeBtn = document.getElementById(`btn-${grade}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'border-gray-100');
        activeBtn.classList.add('active-filter', 'bg-white', 'text-blue-600', 'border-blue-300');
    }

    const cards = document.querySelectorAll('.topic-card');
    let visibleCount = 0;
    let completedCount = 0;

    const user = JSON.parse(localStorage.getItem('mathIslandUser'));
    const completedExercises = user?.completedExercises || [];

    cards.forEach(card => {
        if (card.getAttribute('data-grade') === String(grade)) {
            card.style.display = 'block';
            visibleCount++;
            if (completedExercises.includes(card.id)) completedCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noContentMsg = document.getElementById('no-content-msg');
    if (noContentMsg) {
        visibleCount === 0 ? noContentMsg.classList.remove('hidden') : noContentMsg.classList.add('hidden');
    }

    // İlerleme Çubuğu Güncellemesi
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');

    if (visibleCount > 0 && progressContainer) {
        progressContainer.classList.remove('hidden');
        progressText.innerText = `${grade}. Sınıf İlerlemen`;
        const percentage = Math.round((completedCount / visibleCount) * 100);
        progressPercent.innerText = `%${percentage}`;
        progressBar.style.width = `${percentage}%`;
    } else if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
};

// Modalları Aç/Kapat
window.openProfileModal = () => {
    const m = document.getElementById('profile-modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
};
window.closeProfileModal = () => {
    const m = document.getElementById('profile-modal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
};

const updateProfileUI = (user) => {
    const scoreEl = document.getElementById('user-total-score');
    const modalScoreEl = document.getElementById('modal-score');
    if (scoreEl) scoreEl.innerText = `${user.score} ⭐`;
    if (modalScoreEl) modalScoreEl.innerText = user.score;
};

// --- Sayfa Yüklenirken Çalışan Ana Kod ---
document.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem('mathIslandUser');

    if (savedUser) {
        const user = JSON.parse(savedUser);

        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-name').textContent = user.ad;
        document.getElementById('user-pic').src = user.avatar;
        updateProfileUI(user);

        if (document.getElementById('modal-user-name')) document.getElementById('modal-user-name').innerText = `${user.ad} ${user.soyad}`;
        if (document.getElementById('modal-user-pic')) document.getElementById('modal-user-pic').src = user.avatar;
        if (document.getElementById('modal-user-grade')) document.getElementById('modal-user-grade').innerText = user.sinif;

        generateTopics();

        let startingGrade = '1';
        if (user && user.sinif) {
            startingGrade = String(user.sinif).charAt(0);
        }

        if (!['1', '2', '3', '4'].includes(startingGrade)) {
            startingGrade = '1';
        }

        filterGrade(startingGrade);

    } else {
        alert("Alıştırmaları görmek için giriş yapmalısın!");
        window.location.href = '../index.html';
    }

    // Quiz Button Listeners
    document.getElementById('prev-question-btn')?.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });

    document.getElementById('next-question-btn')?.addEventListener('click', () => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    });

    const logoutBtn = document.getElementById('modal-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('mathIslandUser');
            window.location.href = '../index.html';
        });
    }

    const finishBtn = document.getElementById('finish-lesson-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {

            if (document.getElementById('quiz-result-container').classList.contains('hidden')) {
                // Tüm soruları yanıtlamadıysa uyar (Opsiyonel: Eğer boş bıraktıysa)
                if (userAnswers.includes(null)) {
                    if (!confirm("Boş bıraktığın sorular var. Yinede bitirmek istiyor musun?")) return;
                }
                showQuizResult();
                return;
            }

            // Eğer sonuç ekranındaysa:
            if (!currentLessonId) return;

            if (isQuizPassed) {
                // Barajı geçti
                let user = JSON.parse(localStorage.getItem('mathIslandUser'));
                if (!user.completedExercises) user.completedExercises = [];

                if (!user.completedExercises.includes(currentLessonId)) {
                    user.completedExercises.push(currentLessonId);
                    user.score = (parseInt(user.score) || 0) + 10;

                    localStorage.setItem('mathIslandUser', JSON.stringify(user));
                    updateProfileUI(user);

                    generateTopics();

                    const activeFilterBtn = document.querySelector('.filter-btn.active-filter');
                    const currentGrade = activeFilterBtn ? activeFilterBtn.id.split('-')[1] : '1';
                    filterGrade(currentGrade);
                }
                closeLessonModal();
            } else {
                // Barajı Geçemedi, Sadece Modalı Kapat veya Retried state'e sok
                // Modal'ı kapatıp yeniden girmesini isteyeceğiz
                closeLessonModal();
            }
        });
    }
});