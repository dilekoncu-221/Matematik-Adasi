// --- 1. API Ayarları ---
const API_KEY = "AIzaSyBsh44drO5JpfACJJcWefuFYS5gN3SOAWQ";

// --- 2. Konu Veri Seti ---
const classTopics = {
    "1": ["Rakamları Tanıyalım", "Nesne Sayma", "Toplama Giriş", "Çıkarma Giriş", "Geometrik Şekiller", "Örüntüler", "Paralarımız", "Zamanı Ölçme", "Uzamsal İlişkiler"],
    "2": ["İki Basamaklı Sayılar", "Eldeli Toplama", "Onluk Bozarak Çıkarma", "Çarpma İşlemi", "Bölme Giriş", "Kesirler", "Uzunluk Ölçme", "Sıvı Ölçme", "Çarpım Tablosu"],
    "3": ["Üç Basamaklı Sayılar", "Romen Rakamları", "Eldeli Toplama", "Onluk Bozarak Çıkarma", "Çarpma İşlemi", "Kısa Yoldan Bölme", "Birim Kesirler", "Alan Ölçme", "Çevre Hesaplama"],
    "4": ["Dört Basamaklı Sayılar", "Açı Türleri", "Kesir Toplama", "Ondalık Gösterim", "Zaman Dönüşümü", "Dikdörtgen Alanı", "Zihinden Çarpma", "Kalanlı Bölme", "Simetri"]
};

// YENİ: Açıktan Mora Renk Paleti (Senin hazırladığın)
const gradeColors = {
    "1": { bg: "bg-pink-300", badge: "bg-pink-500", light: "bg-pink-50", border: "border-pink-200", text: "text-pink-500", check: "bg-green-400" },
    "2": { bg: "bg-fuchsia-400", badge: "bg-fuchsia-500", light: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-600", check: "bg-green-500" },
    "3": { bg: "bg-purple-500", badge: "bg-purple-600", light: "bg-purple-50", border: "border-purple-300", text: "text-purple-600", check: "bg-green-600" },
    "4": { bg: "bg-indigo-500", badge: "bg-indigo-600", light: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-600", check: "bg-emerald-500" }
};

const getFunSentence = (topic) => {
    const sentences = [
        "sırlarını keşfetmeye hazır mısın?", "ile harika bir maceraya atıl!", "dünyasında eğlenceli bir yolculuk seni bekliyor.",
        "konusunda ustalaşma zamanı!", "ile süper zekanı herkese göster!"
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
};

// --- YENİ: Puanlara Göre Unvan Belirleme ---
const getUserTitle = (score) => {
    if (score <= 50) return "Çırak Büyücü 🪄";
    if (score <= 150) return "Sayıların Şövalyesi 🗡️";
    if (score <= 300) return "Matematik Perisi 🧚‍♀️";
    return "Sonsuzluk Kaptanı 🚀";
};

// --- YENİ: Sesli Okuma (Text-to-Speech) Fonksiyonları ---
window.readAloud = (elementId) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Önceki sesi durdur
        const text = document.getElementById(elementId).innerText;
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;  // Okuma hızı (Çocuklar için ideal)
        utterance.pitch = 1.2; // YENİ: Sesin inceliği. 1.2 yaparak daha neşeli ve tatlı bir öğretmen tonu elde ediyoruz.

        // YENİ: Bilgisayardaki en doğal Türkçe sesi bulmaya çalış
        const voices = window.speechSynthesis.getVoices();
        const turkishVoices = voices.filter(voice => voice.lang.includes('tr'));

        if (turkishVoices.length > 0) {
            // Özellikle "Google" veya Mac'lerdeki "Yelda" gibi daha doğal sesleri öncelikli seç
            const naturalVoice = turkishVoices.find(voice =>
                voice.name.includes('Google') ||
                voice.name.includes('Yelda') ||
                voice.name.includes('Premium')
            ) || turkishVoices[0]; // Bulamazsa ilk Türkçe sesi seç

            utterance.voice = naturalVoice;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        alert("Tarayıcın sihirli sesli okuma özelliğini desteklemiyor 😔");
    }
};

window.stopReading = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

// --- Modal ve Eğitim Kontrol Değişkenleri ---
window.currentLessonId = null;
window.currentLessonName = null;
window.currentLessonData = null;
window.currentStep = 0;
window.currentQuizStep = 0;
window.currentLessonPoints = 10;
window.userAnswers = {};

// --- 3. YAPAY ZEKA (GEMINI API) BAĞLANTISI ---
async function fetchContentFromAI(topicName, grade) {
    const prompt = `Sen tatlı, eğlenceli ama ÖĞRENCİ HATA YAPTIĞINDA DOĞRUSUNU GÖSTEREN bir ilkokul matematik öğretmenisin. 
    Öğrencin ${grade}. sınıf öğrencisi. Ona "${topicName}" konusunu anlatacaksın.
    
    Bana SADECE geçerli bir JSON objesi döndür. Kod bloğu KULLANMA.
    DİKKAT 1: "content" VE "example" kısımları ASLA paragraf olmasın. Kısa maddeler halinde (dizi/array olarak) ver.
    DİKKAT 2: Örnekleri uzun yazıyla anlatma, matematiksel semboller kullan (Örn: 5 + 3 = 8).
    
    JSON yapısı tam olarak şöyle olmalı:
    {
        "steps": [
            { 
              "title": "Giriş Başlığı", 
              "content": ["Kısa bilgi 1.", "Kısa bilgi 2."],
              "tip": "Bu konunun en önemli 'Püf Noktası'. Sadece 1 cümle.",
              "example": ["Örnek işlem 1: 10 - 4 = 6", "Örnek işlem 2: 5 + 2 = 7"]
            },
            { 
              "title": "Biraz Daha Derine", 
              "content": ["Detay 1.", "Detay 2."],
              "tip": "Dikkat edilmesi gereken kural.",
              "example": ["Örnek 1", "Örnek 2"]
            },
            { 
              "title": "Son Adım", 
              "content": ["Son toparlama.", "Teste motive eden söz."],
              "tip": "Son bir hatırlatma.",
              "example": ["Son örnek 1", "Son örnek 2"]
            }
        ],
        "quiz": [
            { 
              "q": "Soru 1 metni", 
              "options": ["Şık A", "Şık B", "Şık C", "Şık D"], 
              "correct": 0,
              "explanation": "DİKKAT: Bu metin ÇOCUK YANLIŞ CEVAP VERDİĞİNDE gösterilecek. Asla 'Harikasın', 'Tebrikler' DEME. 'Neredeyse buluyordun! Ama unutma ki doğru cevap şudur...' şeklinde nazikçe DÜZELTİCİ bir metin yaz."
            },
            { "q": "Soru 2 metni", "options": ["Şık A", "Şık B", "Şık C", "Şık D"], "correct": 1, "explanation": "Hatayı açıklayan tatlı ama düzeltici mesaj." },
            { "q": "Soru 3 metni", "options": ["Şık A", "Şık B", "Şık C", "Şık D"], "correct": 2, "explanation": "Hatayı açıklayan tatlı ama düzeltici mesaj." },
            { "q": "Soru 4 metni", "options": ["Şık A", "Şık B", "Şık C", "Şık D"], "correct": 3, "explanation": "Hatayı açıklayan tatlı ama düzeltici mesaj." },
            { "q": "Soru 5 metni", "options": ["Şık A", "Şık B", "Şık C", "Şık D"], "correct": 0, "explanation": "Hatayı açıklayan tatlı ama düzeltici mesaj." }
        ]
    }
    Cevaplar (correct) 0,1,2 veya 3 olmalı. Sınav tam bu konuya ait olmalı.`;

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
        const firstBrace = aiText.indexOf('{');
        const lastBrace = aiText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            aiText = aiText.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(aiText);
    } catch (error) {
        return null;
    }
}

const calculatePoints = (lessonGrade) => {
    const user = JSON.parse(localStorage.getItem('mathIslandUser')) || {};
    const userGrade = parseInt(String(user.sinif || "1").charAt(0));
    const targetGrade = parseInt(lessonGrade);

    if (targetGrade < userGrade) return 5;
    if (targetGrade > userGrade) return 20;
    return 10;
};

// --- 4. EĞİTİM MOTORU ---
window.startLesson = async (id, name, isRetry = false) => {
    window.stopReading(); // Yeni konuya geçerken sesi sustur
    window.currentLessonId = id;
    window.currentLessonName = name;
    window.currentStep = 0;
    window.currentQuizStep = 0;
    window.userAnswers = {};

    const grade = id.split('-')[0].replace('g', '');
    window.currentLessonPoints = calculatePoints(grade);

    const modal = document.getElementById('lesson-modal');
    const modalContent = modal.querySelector('.modal-content');
    modalContent.classList.remove('max-w-4xl', 'h-[80vh]');
    modalContent.classList.add('max-w-[98vw]', 'md:max-w-[90vw]', 'xl:max-w-7xl', 'h-[95vh]');

    const lessonNameDisplay = document.getElementById('lesson-name-display');
    const contentArea = document.getElementById('lesson-content');
    const footerArea = document.querySelector('.lesson-footer');

    const rewardBadge = modal.querySelector('.bg-yellow-100');
    if (rewardBadge) {
        rewardBadge.innerHTML = `<i class="fa-solid fa-star"></i> Ödül: ${window.currentLessonPoints} ⭐`;
    }

    lessonNameDisplay.innerText = name;

    const oldSymbols = modal.querySelectorAll('.magic-bg-symbols');
    oldSymbols.forEach(el => el.remove());

    const symbolsHTML = `
        <div class="magic-bg-symbols fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <i class="magic-symbol fa-solid fa-plus text-7xl text-pink-300 opacity-60" style="top: 10%; left: 5%; animation-duration: 12s;"></i>
            <i class="magic-symbol fa-solid fa-minus text-6xl text-blue-300 opacity-60" style="top: 50%; left: 8%; animation-duration: 15s;"></i>
            <i class="magic-symbol fa-solid fa-xmark text-8xl text-green-300 opacity-50" style="bottom: 10%; left: 15%; animation-duration: 10s;"></i>
            <i class="magic-symbol fa-solid fa-divide text-[8rem] text-purple-300 opacity-40" style="top: 15%; right: 5%; animation-duration: 14s;"></i>
            <i class="magic-symbol fa-solid fa-equals text-7xl text-yellow-300 opacity-70" style="bottom: 20%; right: 10%; animation-duration: 11s;"></i>
            <i class="magic-symbol fa-solid fa-shapes text-[6rem] text-pink-200 opacity-50" style="top: 70%; right: 2%; animation-duration: 16s;"></i>
            <i class="magic-symbol fa-solid fa-star text-5xl text-yellow-400 opacity-80" style="top: 5%; right: 40%; animation-duration: 9s;"></i>
        </div>
    `;
    modal.insertAdjacentHTML('afterbegin', symbolsHTML);

    contentArea.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full max-w-md mx-auto h-full relative z-10">
            <i class="fa-solid fa-wand-magic-sparkles text-7xl text-pink-300 mb-6 animate-pulse"></i>
            <h3 class="text-3xl font-black text-pink-500 text-center mb-6">
                ${isRetry ? 'Senin için yepyeni sorular hazırlıyorum...' : 'Büyülü Eğitim Sayfaları Hazırlanıyor...'}
            </h3>
            <div class="w-full bg-pink-100 rounded-full h-4 mb-4 overflow-hidden relative shadow-inner">
                <div class="bg-gradient-to-r from-pink-400 to-pink-500 h-4 rounded-full animate-loading absolute left-0 top-0 w-1/2"></div>
            </div>
            <p class="text-gray-400 font-bold mt-2 text-center text-lg">Yapay zeka öğretmeniniz konuyu yazıyor 🚀</p>
        </div>
    `;
    footerArea.innerHTML = `<button onclick="window.closeLessonModal()" class="bg-white border-4 border-gray-100 text-gray-400 font-black py-3 px-8 rounded-2xl relative z-10 hover:bg-gray-50 transition">Vazgeç</button>`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    window.currentLessonData = await fetchContentFromAI(name, grade);
    if (!window.currentLessonData) {
        contentArea.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center relative z-10"><i class="fa-solid fa-face-frown text-6xl text-red-400 mb-4"></i><h3 class="text-2xl text-red-500 font-bold text-center">Eyvah, sihirli bağlantımız koptu!<br>Lütfen tekrar dene.</h3></div>`;
        return;
    }

    window.renderStep();
};

window.renderStep = () => {
    window.stopReading(); // Sayfa değiştikçe sesi durdur
    const contentArea = document.getElementById('lesson-content');
    const footerArea = document.querySelector('.lesson-footer');
    contentArea.classList.add('hide-scrollbar');

    if (window.currentStep < window.currentLessonData.steps.length) {
        const stepData = window.currentLessonData.steps[window.currentStep];

        let listHTML = "";
        if (Array.isArray(stepData.content)) {
            listHTML = `<ul class="space-y-4 text-left w-full mt-2">`;
            stepData.content.forEach(item => {
                let formattedItem = item.replace(/önemli/gi, '<span class="text-pink-500 font-black">önemli</span>').replace(/dikkat/gi, '<span class="text-deepPink font-black drop-shadow-sm">dikkat</span>');
                listHTML += `<li class="flex items-start bg-pink-50/30 p-4 rounded-2xl"><i class="fa-solid fa-star text-2xl text-yellow-400 mr-4 mt-1 drop-shadow-sm"></i><span class="text-2xl font-bold text-gray-700 leading-relaxed">${formattedItem}</span></li>`;
            });
            listHTML += `</ul>`;
        }

        let exHTML = "";
        if (Array.isArray(stepData.example)) {
            exHTML = `<ul class="space-y-3 text-left w-full mt-2">`;
            stepData.example.forEach(item => {
                exHTML += `<li class="flex items-start"><i class="fa-solid fa-arrow-right text-blue-400 mr-3 mt-1 text-xl"></i><span class="text-2xl font-bold text-gray-700 leading-relaxed">${item}</span></li>`;
            });
            exHTML += `</ul>`;
        } else {
            exHTML = `<p class="text-2xl font-bold text-gray-700 leading-relaxed">${stepData.example}</p>`;
        }

        contentArea.innerHTML = `
            <div class="page-enter w-full h-full flex flex-col items-center p-6 md:p-10 text-center relative z-10 overflow-y-auto hide-scrollbar">
                
                <div class="flex items-center justify-center gap-4 mb-8">
                    <div class="bg-gradient-to-r from-pink-400 to-pink-500 text-white font-black px-8 py-3 rounded-full shrink-0 shadow-lg text-xl transform -rotate-2">
                        ✨ Sihirli Sayfa ${window.currentStep + 1} / ${window.currentLessonData.steps.length} ✨
                    </div>
                    <button onclick="window.readAloud('readable-content')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 border-2 border-blue-200 font-black px-5 py-3 rounded-full shadow-sm transition transform hover:scale-105 flex items-center z-20">
                        <i class="fa-solid fa-volume-high mr-2 text-xl animate-pulse"></i> Sesli Oku
                    </button>
                </div>
                
                <div id="readable-content" class="w-full max-w-5xl flex flex-col gap-8 pb-10">
                    <h3 class="text-4xl md:text-5xl font-black text-gray-800 mb-2 drop-shadow-sm">${stepData.title}</h3>
                    <div class="bg-white p-8 md:p-10 rounded-[2.5rem] border-4 border-pink-200 shadow-xl flex flex-col items-center">
                         ${listHTML}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-yellow-50 border-4 border-yellow-300 p-8 rounded-[2rem] text-left shadow-md hover:shadow-lg transition">
                            <h4 class="text-yellow-600 font-black mb-4 flex items-center text-2xl">
                                <i class="fa-solid fa-lightbulb text-4xl mr-3 animate-pulse text-yellow-500"></i> Püf Noktası
                            </h4>
                            <p class="text-2xl font-bold text-gray-700 leading-relaxed">${stepData.tip}</p>
                        </div>
                        
                        <div class="bg-blue-50 border-4 border-blue-300 p-8 rounded-[2rem] text-left shadow-md hover:shadow-lg transition">
                            <h4 class="text-blue-500 font-black mb-4 flex items-center text-2xl">
                                <i class="fa-solid fa-flask text-4xl mr-3 text-blue-500"></i> Harika Bir Örnek
                            </h4>
                            <div class="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-inner">
                                ${exHTML}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        footerArea.innerHTML = `
            <button onclick="window.closeLessonModal()" class="bg-white border-4 border-gray-100 text-gray-400 font-black py-4 px-10 rounded-2xl hover:bg-gray-50 transition text-lg relative z-10">Sonra Devam Et</button>
            <button onclick="window.nextStep()" class="bg-pink-500 hover:bg-pink-600 text-white font-black py-4 px-12 rounded-2xl shadow-xl hover:-translate-y-1 text-2xl transform transition relative z-10 flex items-center gap-2">
                İleri <i class="fa-solid fa-rocket"></i>
            </button>
        `;
    } else {
        window.renderQuizStep();
    }
};

window.nextStep = () => {
    window.currentStep++;
    window.renderStep();
};

window.renderQuizStep = () => {
    window.stopReading(); // Soruya geçince sesi sustur
    const contentArea = document.getElementById('lesson-content');
    const footerArea = document.querySelector('.lesson-footer');

    const qIndex = window.currentQuizStep;
    const qData = window.currentLessonData.quiz[qIndex];
    const isLastQuestion = qIndex === window.currentLessonData.quiz.length - 1;

    contentArea.innerHTML = `
        <div class="w-full h-full flex flex-col items-center p-6 md:p-10 page-enter relative z-10 overflow-y-auto hide-scrollbar">
            
            <div class="flex items-center justify-center gap-4 mb-8">
                <div class="bg-yellow-100 text-yellow-600 font-black px-8 py-3 rounded-full shadow-sm text-2xl border-4 border-yellow-200">
                    <i class="fa-solid fa-trophy mr-2"></i> Bilgi Yarışması (${qIndex + 1} / ${window.currentLessonData.quiz.length})
                </div>
                <button onclick="window.readAloud('readable-quiz')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 border-2 border-blue-200 font-black px-4 py-2 rounded-full shadow-sm transition transform hover:scale-105 flex items-center z-20">
                    <i class="fa-solid fa-volume-high text-xl"></i>
                </button>
            </div>
            
            <div id="readable-quiz" class="w-full max-w-4xl bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-pink-200 mt-4">
                <h4 class="font-black text-3xl md:text-4xl text-gray-800 mb-10 text-center leading-tight">${qData.q}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${qData.options.map((opt, optIdx) => {
        const isChecked = window.userAnswers[qIndex] === optIdx ? "checked" : "";
        return `
                        <label class="flex items-center p-6 rounded-3xl border-4 border-gray-100 cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all has-[:checked]:bg-pink-100 has-[:checked]:border-pink-500 has-[:checked]:scale-[1.02] has-[:checked]:shadow-md">
                            <input type="radio" name="q${qIndex}" value="${optIdx}" class="hidden" ${isChecked} onchange="window.userAnswers[${qIndex}] = ${optIdx}">
                            <div class="w-8 h-8 rounded-full border-4 border-gray-300 flex items-center justify-center mr-4 bg-white transition-colors">
                                <div class="w-4 h-4 rounded-full bg-pink-500 hidden check-indicator"></div>
                            </div>
                            <span class="font-black text-gray-700 text-2xl">${opt}</span>
                        </label>
                    `}).join('')}
                </div>
            </div>
        </div>
        <style>
            input:checked + div { border-color: #ec4899; }
            input:checked + div .check-indicator { display: block; }
        </style>
    `;

    footerArea.innerHTML = `
        <button onclick="window.closeLessonModal()" class="bg-white border-4 border-gray-100 text-gray-400 font-black py-4 px-10 rounded-2xl text-lg hover:bg-gray-50 transition relative z-10">Vazgeç</button>
        <button onclick="window.nextQuizStep()" class="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-12 rounded-2xl shadow-xl hover:-translate-y-1 text-2xl flex items-center gap-3 transform transition relative z-10">
            ${isLastQuestion ? 'Testi Bitir <i class="fa-solid fa-flag-checkered"></i>' : 'Sıradaki Soru <i class="fa-solid fa-arrow-right"></i>'}
        </button>
    `;
};

window.nextQuizStep = () => {
    if (window.userAnswers[window.currentQuizStep] === undefined) {
        alert("Lütfen şıklardan birini seçerek ilerle! 🕵️‍♂️");
        return;
    }

    if (window.currentQuizStep < window.currentLessonData.quiz.length - 1) {
        window.currentQuizStep++;
        window.renderQuizStep();
    } else {
        window.checkQuizResults();
    }
};

window.checkQuizResults = () => {
    window.stopReading(); // Karne ekranında sesi sustur
    let correctCount = 0;
    const totalQuestions = window.currentLessonData.quiz.length;
    let feedbackHTML = "";

    window.currentLessonData.quiz.forEach((q, index) => {
        const userAnswer = window.userAnswers[index];
        if (userAnswer === q.correct) {
            correctCount++;
        } else {
            feedbackHTML += `
                <div class="bg-red-50 border-l-[10px] border-red-400 p-6 rounded-2xl mb-6 text-left shadow-sm">
                    <p class="font-black text-gray-800 text-xl mb-3 flex items-start">
                        <i class="fa-solid fa-circle-xmark text-red-500 mr-3 mt-1 text-2xl"></i> 
                        ${index + 1}. Soru: ${q.q}
                    </p>
                    <div class="flex flex-col md:flex-row gap-4 mb-4 text-lg">
                        <div class="bg-white px-4 py-2 rounded-xl border-2 border-red-100 font-bold text-gray-500 flex-1">
                            Senin Cevabın: <span class="line-through text-red-400 ml-2">${q.options[userAnswer]}</span>
                        </div>
                        <div class="bg-green-50 px-4 py-2 rounded-xl border-2 border-green-200 font-bold text-gray-600 flex-1">
                            Doğru Cevap: <span class="text-green-600 font-black ml-2">${q.options[q.correct]}</span>
                        </div>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
                        <p class="font-bold text-blue-700 text-lg flex items-center">
                            <i class="fa-solid fa-chalkboard-user text-blue-500 mr-3 text-2xl"></i>
                            Öğretmenin Notu: <span class="text-gray-700 ml-2">${q.explanation}</span>
                        </p>
                    </div>
                </div>
            `;
        }
    });

    const contentArea = document.getElementById('lesson-content');
    const footerArea = document.querySelector('.lesson-footer');

    if (correctCount >= 4) {

        // YENİ: KONFETİ PATLAMASI! 🎉
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#f472b6', '#c084fc', '#fcd34d', '#4ade80', '#3b82f6'],
                zIndex: 99999
            });
        }

        contentArea.innerHTML = `
            <div class="page-enter w-full h-full overflow-y-auto p-6 md:p-10 hide-scrollbar text-center relative z-10 max-w-5xl mx-auto">
                <i class="fa-solid fa-medal text-[10rem] text-yellow-400 mb-8 animate-bounce drop-shadow-xl"></i>
                <h3 class="text-5xl font-black text-green-500 mb-4 drop-shadow-sm">Harikasın Şampiyon! 🏆</h3>
                <p class="text-3xl font-bold text-gray-600 mb-10 bg-green-50 py-4 px-8 rounded-full inline-block border-4 border-green-200">
                    <span class="text-pink-500 font-black">${totalQuestions}</span> sorudan <span class="text-green-600 font-black">${correctCount}</span> tanesini doğru bildin!
                </p>
                ${feedbackHTML !== "" ? `<h4 class="text-2xl font-black text-gray-500 mb-6 border-b-4 border-gray-100 pb-4 text-left">Gözden Kaçan Ufak Hatalar:</h4> ${feedbackHTML}` : ''}
            </div>
        `;

        footerArea.innerHTML = `
            <button onclick="window.completeLessonAction()" class="bg-yellow-400 hover:bg-yellow-500 text-white font-black py-5 px-12 rounded-[2rem] shadow-2xl hover:-translate-y-2 w-full text-3xl transform transition border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 relative z-10">
                <i class="fa-solid fa-star fa-spin mr-2"></i> ${window.currentLessonPoints} Yıldızı Kap ve Bitir!
            </button>
        `;
    } else {
        contentArea.innerHTML = `
            <div class="page-enter w-full h-full overflow-y-auto p-6 md:p-10 hide-scrollbar text-center relative z-10 max-w-5xl mx-auto">
                <i class="fa-solid fa-face-smile-beam text-[8rem] text-blue-400 mb-6 drop-shadow-lg"></i>
                <h3 class="text-5xl font-black text-blue-500 mb-4">Güzel Bir Denemeydi! 🌈</h3>
                <p class="text-2xl font-bold text-gray-600 mb-10 bg-blue-50 py-4 px-8 rounded-full inline-block border-4 border-blue-200">
                    Hedefimiz en az <span class="text-green-500 font-black">4 doğru</span>. Yapabileceğini biliyorum!
                </p>
                <div class="text-left mb-6">
                    <h4 class="text-2xl font-black text-gray-700 mb-6 border-b-4 border-pink-200 pb-4 flex items-center">
                        <i class="fa-solid fa-wrench text-pink-400 mr-3"></i> Hadi Hatalarımıza Birlikte Bakalım:
                    </h4>
                    ${feedbackHTML}
                </div>
            </div>
        `;

        footerArea.innerHTML = `
            <button onclick="window.startLesson(window.currentLessonId, window.currentLessonName, true)" class="bg-blue-400 hover:bg-blue-500 text-white font-black py-5 px-10 rounded-[2rem] w-full shadow-2xl hover:-translate-y-2 text-2xl transform transition border-b-8 border-blue-600 active:border-b-0 active:translate-y-2 relative z-10">
                <i class="fa-solid fa-rotate-left mr-3"></i> Konuyu Yeniden Öğren ve Tekrar Dene
            </button>
        `;
    }
};

window.completeLessonAction = () => {
    let user = JSON.parse(localStorage.getItem('mathIslandUser'));
    if (!user.completedLessons) user.completedLessons = [];

    if (!user.completedLessons.includes(window.currentLessonId)) {
        user.completedLessons.push(window.currentLessonId);
        user.score = (parseInt(user.score) || 0) + window.currentLessonPoints;
        localStorage.setItem('mathIslandUser', JSON.stringify(user));

        if (typeof window.updateProfileUI === "function") window.updateProfileUI(user);
        if (typeof window.generateTopics === "function") window.generateTopics();

        const activeFilterBtn = document.querySelector('.filter-btn.active-filter');
        const currentGrade = activeFilterBtn ? activeFilterBtn.id.split('-')[1] : '1';
        if (typeof window.filterGrade === "function") window.filterGrade(currentGrade);
    }
    window.closeLessonModal();
};

window.closeLessonModal = () => {
    window.stopReading(); // Modal kapanırken sesi sustur
    const modal = document.getElementById('lesson-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        const oldSymbols = modal.querySelectorAll('.magic-bg-symbols');
        oldSymbols.forEach(el => el.remove());
    }
    window.currentLessonId = null;
    window.currentLessonName = null;
    window.currentLessonData = null;
};

// --- DİNAMİK RENKLİ KART ÜRETİMİ ---
window.generateTopics = () => {
    const grid = document.getElementById('topics-grid');
    const user = JSON.parse(localStorage.getItem('mathIslandUser')) || {};
    const completedLessons = user.completedLessons || [];

    grid.innerHTML = '';

    Object.keys(classTopics).forEach(grade => {
        const c = gradeColors[grade];

        classTopics[grade].forEach((topicName, index) => {
            const topicId = `g${grade}-t${index}`;
            const isDone = completedLessons.includes(topicId);
            const lessonPoints = calculatePoints(grade);
            const funSentence = getFunSentence(topicName);

            const card = document.createElement('div');
            card.setAttribute('data-grade', grade);
            card.id = topicId;

            card.className = `topic-card cursor-pointer p-6 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 shadow-lg
                ${isDone ? `${c.light} border-green-400 shadow-green-100` : `bg-white ${c.border} shadow-pink-50`}`;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="${isDone ? c.check : c.badge} text-white text-sm font-black px-4 py-1.5 rounded-full shadow-sm">${grade}. Sınıf</span>
                    <div class="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border-2 border-yellow-200">
                         <i class="fa-solid fa-star text-yellow-500 text-lg"></i>
                         <span class="font-black text-yellow-600 ml-1">${lessonPoints} Puan</span>
                    </div>
                </div>
                <h3 class="text-2xl font-black text-gray-800 leading-tight mb-3 h-16 flex items-center">${topicName}</h3>
                
                <p class="text-sm font-bold ${isDone ? 'text-green-600' : c.text} mb-5 flex items-start">
                    ${isDone
                    ? '<i class="fa-solid fa-circle-check mt-1 mr-2 text-green-500"></i> Harika, bu konuyu tamamladın!'
                    : `<i class="fa-solid fa-sparkles mt-1 mr-2"></i> ${topicName} ${funSentence}`
                }
                </p>
                
                <div class="flex items-center justify-between mt-auto border-t-2 border-gray-100 pt-5">
                    <span class="text-sm font-black ${isDone ? 'text-green-600' : c.text} uppercase tracking-wider">
                        ${isDone ? 'TEKRAR ET' : 'ÖĞRENMEYE BAŞLA'}
                    </span>
                    <div class="h-12 w-12 flex items-center justify-center rounded-full ${isDone ? c.check : c.badge} text-white shadow-md transition-transform hover:rotate-12 transform hover:scale-110">
                        <i class="fa-solid ${isDone ? 'fa-check' : 'fa-play'} text-lg"></i>
                    </div>
                </div>
            `;

            card.onclick = () => window.startLesson(topicId, topicName);
            grid.appendChild(card);
        });
    });
};

// YENİ: Unvan ve Skor Güncelleme
window.updateProfileUI = (user) => {
    const score = parseInt(user.score) || 0;
    const title = getUserTitle(score);

    const scoreElement = document.getElementById('user-total-score');
    const modalScoreElement = document.getElementById('modal-score');
    const titleElement = document.getElementById('user-title');
    const modalTitleElement = document.getElementById('modal-user-title');

    if (scoreElement) scoreElement.innerText = `${score} ⭐`;
    if (modalScoreElement) modalScoreElement.innerText = score;
    if (titleElement) titleElement.innerText = title;
    if (modalTitleElement) modalTitleElement.innerText = title;
};

window.openProfileModal = () => {
    const m = document.getElementById('profile-modal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
};

window.closeProfileModal = () => {
    const m = document.getElementById('profile-modal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
};

// YENİ: İlerleme Çubuğunu Dinamik Hesaplama
window.filterGrade = (grade) => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active-filter', 'bg-white', 'text-pink-600', 'border-pink-300');
        btn.classList.add('text-gray-400', 'border-gray-100');
    });

    const activeBtn = document.getElementById(`btn-${grade}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'border-gray-100');
        activeBtn.classList.add('active-filter', 'bg-white', 'text-pink-600', 'border-pink-300');
    }

    const cards = document.querySelectorAll('.topic-card');
    let visibleCount = 0;

    cards.forEach(card => {
        if (card.getAttribute('data-grade') === String(grade)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // İlerleme Barını Güncelle
    const user = JSON.parse(localStorage.getItem('mathIslandUser')) || {};
    const completedLessons = user.completedLessons || [];
    const totalInGrade = classTopics[grade].length;
    let completedInGrade = 0;

    classTopics[grade].forEach((_, index) => {
        if (completedLessons.includes(`g${grade}-t${index}`)) completedInGrade++;
    });

    const percent = Math.round((completedInGrade / totalInGrade) * 100);

    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');

    if (progressContainer) {
        progressContainer.classList.remove('hidden');
        progressText.innerText = `${grade}. Sınıf İlerlemen`;
        progressPercent.innerText = `%${percent}`;
        progressBar.style.width = `${percent}%`;
    }

    const noContentMsg = document.getElementById('no-content-msg');
    if (noContentMsg) {
        visibleCount === 0 ? noContentMsg.classList.remove('hidden') : noContentMsg.classList.add('hidden');
    }
};

const highlightUserGradeButton = (userGrade) => {
    const btn = document.getElementById(`btn-${userGrade}`);
    if (btn && !btn.querySelector('.fa-crown')) {
        btn.classList.add('relative');
        btn.innerHTML += `<i class="fa-solid fa-crown text-yellow-400 absolute -top-4 -right-3 text-3xl rotate-12 drop-shadow-md animate-pulse"></i>`;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem('mathIslandUser');

    if (savedUser) {
        const user = JSON.parse(savedUser);

        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-name').textContent = user.ad;
        document.getElementById('user-pic').src = user.avatar;

        window.updateProfileUI(user);

        if (document.getElementById('modal-user-name')) document.getElementById('modal-user-name').innerText = `${user.ad} ${user.soyad}`;
        if (document.getElementById('modal-user-pic')) document.getElementById('modal-user-pic').src = user.avatar;
        if (document.getElementById('modal-user-grade')) document.getElementById('modal-user-grade').innerText = user.sinif;

        window.generateTopics();

        let startingGrade = user.sinif ? String(user.sinif).charAt(0) : '1';
        if (!['1', '2', '3', '4'].includes(startingGrade)) {
            startingGrade = '1';
        }

        highlightUserGradeButton(startingGrade);
        window.filterGrade(startingGrade);

    } else {
        alert("Eğitimleri görmek için giriş yapmalısın!");
        window.location.href = '../index.html';
    }

    const logoutBtn = document.getElementById('modal-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('mathIslandUser');
            window.location.href = '../index.html';
        });
    }
});