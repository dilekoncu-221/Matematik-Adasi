const gameData = {
    "1": ["Sayı Avcısı", "Şekil Eşleştirme", "Hızlı Toplama"],
    "2": ["Çarpım Tablosu Koşusu", "Onluk Bozma Savaşı", "Zihinden İşlem"],
    "3": ["3 Basamaklı Macera", "Bölme Adası", "Geometri Bulmacası"],
    "4": ["Ondalık Gezegen", "Açı Savaşı", "Problem Çözme Maratonu"]
};

let currentGameId = null;
let currentGameName = null;
let gameInterval;
let gameTimer;
let currentScore = 0;
let gameType = "balloon"; // balloon, clicker, treasure

const generateGames = () => {
    const grid = document.getElementById('topics-grid');
    const user = JSON.parse(localStorage.getItem('mathIslandUser'));
    const completedGames = user?.completedGames || [];

    grid.innerHTML = '';

    Object.keys(gameData).forEach(grade => {
        gameData[grade].forEach((gameName, index) => {
            const gameId = `g${grade}-g${index}`;
            const isDone = completedGames.includes(gameId);

            const card = document.createElement('div');
            card.setAttribute('data-grade', grade);
            card.id = gameId;
            card.style.display = 'none';

            card.className = `topic-card cursor-pointer p-6 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 shadow-lg flex flex-col justify-between min-h-[16rem]
                ${isDone ? 'bg-green-50 border-green-400 shadow-green-100' : 'bg-white border-purple-200 shadow-purple-100'}`;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="${isDone ? 'bg-green-500' : 'bg-purple-500'} text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">${grade}. Sınıf</span>
                    <div class="flex items-center gap-1">
                         <i class="fa-solid fa-star ${isDone ? 'text-yellow-500' : 'text-gray-200'} text-xl drop-shadow-sm"></i>
                    </div>
                </div>
                
                <h3 class="text-xl font-black text-gray-800 leading-tight mb-2 flex-grow">${gameName}</h3>
                
                <div class="mt-auto">
                    <p class="text-xs font-bold ${isDone ? 'text-green-600' : 'text-purple-600'} mb-3">
                        ${isDone ? '✨ Rekor Kırıldı!' : '🏆 10 Yıldız Kazan!'}
                    </p>
                    <div class="flex items-center justify-between border-t ${isDone ? 'border-green-200' : 'border-purple-100'} pt-4">
                        <span class="text-xs font-black ${isDone ? 'text-green-600' : 'text-purple-600'} uppercase">
                            ${isDone ? 'TEKRAR OYNA' : 'HEMEN OYNA'}
                        </span>
                        <div class="h-10 w-10 flex items-center justify-center rounded-full ${isDone ? 'bg-green-500' : 'bg-purple-500'} text-white shadow-md transition-transform hover:rotate-12">
                            <i class="fa-solid ${isDone ? 'fa-check' : 'fa-play'} text-sm"></i>
                        </div>
                    </div>
                </div>
            `;

            card.onclick = () => openGameModal(gameId, gameName);
            grid.appendChild(card);
        });
    });
};

const determineGameType = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('hızlı') || lower.includes('koşu') || lower.includes('maraton') || lower.includes('işlem')) {
        return "clicker";
    } else if (lower.includes('macera') || lower.includes('ada') || lower.includes('gezegen') || lower.includes('savaş')) {
        return "treasure";
    }
    return "balloon";
};

/* --- DUMMY GAME MECHANICS --- */
window.openGameModal = (id, name) => {
    currentGameId = id;
    currentGameName = name;
    gameType = determineGameType(name);

    const nameDisplay = document.getElementById('game-name-display');
    if (nameDisplay) nameDisplay.innerText = name;

    currentScore = 0;
    document.getElementById('game-score-counter').innerText = currentScore;
    
    const activeScreen = document.getElementById('game-active-screen');
    const startScreen = document.getElementById('game-start-screen');
    
    startScreen.classList.remove('hidden');
    startScreen.classList.add('flex');
    activeScreen.classList.add('hidden');
    document.getElementById('game-result-container').classList.add('hidden');
    document.getElementById('game-result-container').classList.remove('flex');
    
    const finishBtn = document.getElementById('finish-game-btn');
    if(finishBtn) finishBtn.classList.add('hidden');

    // Start Screen Metni Ayarla
    let icon = "fa-play";
    let desc = "Oyuna başla!";
    if(gameType === "clicker") { icon = "fa-bolt"; desc = "10 saniye boyunca butona ne kadar hızlı basabilirsin? Hızını göster!"; }
    if(gameType === "treasure") { icon = "fa-gem"; desc = "Üç gizemli kutu var. Sandıkları kır, en çok puanı topla! Hızlı olmalısın."; }
    if(gameType === "balloon") { icon = "fa-crosshairs"; desc = "Yukarı çıkan doğru balonları patlat. Hedefi şaşırma!"; }

    startScreen.innerHTML = `
        <i class="fa-solid ${icon} text-7xl text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] cursor-pointer hover:scale-110 transition-transform hover:text-purple-300" onclick="window.startDummyGame()"></i>
        <h3 class="text-3xl font-black text-white mb-2">Oyuna Başla</h3>
        <p class="text-slate-400 font-bold max-w-sm text-center">${desc}</p>
    `;

    const modal = document.getElementById('game-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeGameModal = () => {
    const modal = document.getElementById('game-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    clearInterval(gameInterval);
    clearTimeout(gameTimer);
    currentGameId = null;
    document.getElementById('game-active-screen').innerHTML = ''; 
};

window.startDummyGame = () => {
    document.getElementById('game-start-screen').classList.add('hidden');
    document.getElementById('game-start-screen').classList.remove('flex');
    
    const activeScreen = document.getElementById('game-active-screen');
    activeScreen.classList.remove('hidden');
    activeScreen.innerHTML = '';
    
    currentScore = 0;
    document.getElementById('game-score-counter').innerText = 0;

    if (gameType === "balloon") {
        activeScreen.className = "w-full h-full relative cursor-crosshair z-10";
        let counter = 0;
        gameInterval = setInterval(() => {
            createBubble(activeScreen);
            counter++;
            if(counter > 15) clearInterval(gameInterval);
        }, 600);
        gameTimer = setTimeout(() => endDummyGame(), 10000);
    } 
    else if (gameType === "clicker") {
        activeScreen.className = "w-full h-full flex flex-col items-center justify-center z-10 p-4";
        activeScreen.innerHTML = `
            <div class="text-white text-2xl font-black mb-6 animate-pulse">Kalan Süre: <span id="click-time" class="text-yellow-400">10</span></div>
            <button id="fast-click-btn" class="w-64 h-64 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_40px_rgba(168,85,247,0.6)] border-8 border-white text-white font-black text-4xl transform transition active:scale-90 select-none cursor-pointer flex items-center justify-center">
                TIKLA!
            </button>
            <p class="text-slate-400 font-bold mt-8">Gözünü kırpma, olabildiğince hızlı dokun!</p>
        `;

        const clickBtn = document.getElementById('fast-click-btn');
        clickBtn.addEventListener('mousedown', () => {
            currentScore += 5;
            document.getElementById('game-score-counter').innerText = currentScore;
            
            // Randomly move button slightly to make it challenging
            clickBtn.style.transform = `scale(0.9) translate(${Math.random()*10 - 5}px, ${Math.random()*10 - 5}px)`;
            setTimeout(() => { clickBtn.style.transform = "scale(1)"; }, 50);
        });

        let t = 10;
        gameInterval = setInterval(() => {
            t--;
            document.getElementById('click-time').innerText = t;
            if (t <= 0) {
                clearInterval(gameInterval);
                endDummyGame();
            }
        }, 1000);
    }
    else if (gameType === "treasure") {
        activeScreen.className = "w-full h-full flex flex-col items-center justify-center z-10";
        activeScreen.innerHTML = `
            <div class="text-white text-2xl font-black mb-10">Şans Sandıklarından Birini Aç!</div>
            <div id="chests-container" class="flex justify-center gap-8 flex-wrap max-w-2xl">
            </div>
            <p class="text-slate-400 font-bold mt-10">Yanlış sandığı açarsan puan kaybedebilirsin. Dikkatli ol!</p>
        `;

        const container = document.getElementById('chests-container');
        for(let i=0; i<3; i++) {
            const chest = document.createElement('div');
            chest.className = "w-32 h-32 md:w-40 md:h-40 bg-purple-900 border-4 border-purple-400 rounded-xl shadow-lg cursor-pointer flex flex-col items-center justify-center transform hover:scale-105 transition hover:shadow-purple-400/50";
            chest.innerHTML = `<i class="fa-solid fa-box-archive text-5xl text-purple-300 mb-2"></i><span class="text-purple-200 font-bold">Kutu ${i+1}</span>`;
            
            chest.onclick = () => {
                if(chest.dataset.opened === "true") return;
                chest.dataset.opened = "true";
                
                const points = [10, 25, -5, 50, 0][Math.floor(Math.random() * 5)];
                currentScore += points;
                if(currentScore < 0) currentScore = 0;
                document.getElementById('game-score-counter').innerText = currentScore;
                
                chest.innerHTML = points > 0 ? 
                    `<i class="fa-solid fa-coins text-5xl text-yellow-400 mb-2 animate-bounce"></i><span class="text-green-400 font-black">+${points} Puan</span>` :
                    `<i class="fa-solid fa-skull text-5xl text-red-500 mb-2"></i><span class="text-red-400 font-black">Boş Çıktı!</span>`;
                
                chest.classList.replace('bg-purple-900', points > 0 ? 'bg-green-900' : 'bg-red-900');
                chest.classList.replace('border-purple-400', points > 0 ? 'border-green-400' : 'border-red-400');
            };
            container.appendChild(chest);
        }

        // Tıklamalar bittikten sonra bitir demek için, oyun süresini 8 saniye verelim.
        gameTimer = setTimeout(() => endDummyGame(), 8000);
    }
};

const createBubble = (container) => {
    const target = document.createElement('div');
    const MathSign = ['12', '+', '5', '8', '-', '25', 'x', '/'][Math.floor(Math.random() * 8)];
    
    target.className = `absolute flex items-center justify-center font-black text-white text-3xl shadow-lg cursor-pointer transform hover:scale-110 active:scale-90 transition-transform hover:shadow-cyan-400/50`;
    
    const size = Math.floor(Math.random() * 40) + 60; // 60px - 100px
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-yellow-400', 'bg-green-400'];
    target.classList.add(colors[Math.floor(Math.random()*colors.length)], 'rounded-full');
    
    target.innerText = MathSign;
    
    const leftPos = Math.floor(Math.random() * 80) + 10;
    target.style.left = `${leftPos}%`;
    target.style.bottom = '-100px'; 
    
    container.appendChild(target);

    let pos = -100;
    const speed = Math.random() * 3 + 2; 

    const mv = setInterval(() => {
        if(pos > container.offsetHeight) {
            clearInterval(mv);
            if(target.parentElement) target.remove();
        } else {
            pos += speed;
            target.style.bottom = `${pos}px`;
        }
    }, 20);

    target.onmousedown = () => {
        clearInterval(mv);
        currentScore += 10;
        document.getElementById('game-score-counter').innerText = currentScore;
        
        target.innerHTML = '💥';
        target.classList.add('scale-150', 'opacity-0');
        setTimeout(() => { if(target.parentElement) target.remove() }, 300);
    };
};

const endDummyGame = () => {
    clearInterval(gameInterval);
    document.getElementById('game-active-screen').innerHTML = ''; 
    document.getElementById('game-active-screen').classList.add('hidden');
    
    const resultContainer = document.getElementById('game-result-container');
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('flex');
    
    document.getElementById('final-score-text').innerText = currentScore;

    const finishBtn = document.getElementById('finish-game-btn');
    if(finishBtn) finishBtn.classList.remove('hidden');

    if(typeof confetti !== 'undefined') {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#9333ea', '#a855f7', '#fcd34d'] });
    }
};

/* --- FILTERS & PROFILE --- */
window.filterGrade = (grade) => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active-filter', 'bg-white', 'text-purple-600', 'border-purple-300');
        btn.classList.add('text-gray-400', 'border-gray-100');
    });

    const activeBtn = document.getElementById(`btn-${grade}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'border-gray-100');
        activeBtn.classList.add('active-filter', 'bg-white', 'text-purple-600', 'border-purple-300');
    }

    const cards = document.querySelectorAll('.topic-card');
    let visibleCount = 0;
    let completedCount = 0;

    const user = JSON.parse(localStorage.getItem('mathIslandUser'));
    const completedGames = user?.completedGames || [];

    cards.forEach(card => {
        if (card.getAttribute('data-grade') === String(grade)) {
            card.style.display = 'block';
            visibleCount++;
            if (completedGames.includes(card.id)) completedCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noContentMsg = document.getElementById('no-content-msg');
    if (noContentMsg) {
        visibleCount === 0 ? noContentMsg.classList.remove('hidden') : noContentMsg.classList.add('hidden');
    }

    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');

    if (visibleCount > 0 && progressContainer) {
        progressContainer.classList.remove('hidden');
        progressText.innerText = `${grade}. Sınıf Oyun İlerlemen`;
        const percentage = Math.round((completedCount / visibleCount) * 100);
        progressPercent.innerText = `%${percentage}`;
        progressBar.style.width = `${percentage}%`;
    } else if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
};

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

        generateGames();

        let startingGrade = '1';
        if (user && user.sinif) {
            startingGrade = String(user.sinif).charAt(0);
        }

        if (!['1', '2', '3', '4'].includes(startingGrade)) {
            startingGrade = '1';
        }

        filterGrade(startingGrade);

    } else {
        alert("Oyunları oynamak için giriş yapmalısın!");
        window.location.href = '../index.html';
    }

    const logoutBtn = document.getElementById('modal-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('mathIslandUser');
            window.location.href = '../index.html';
        });
    }

    const finishBtn = document.getElementById('finish-game-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            if (!currentGameId) return;

            let user = JSON.parse(localStorage.getItem('mathIslandUser'));
            if (!user.completedGames) user.completedGames = [];

            if (!user.completedGames.includes(currentGameId)) {
                user.completedGames.push(currentGameId);
                user.score = (parseInt(user.score) || 0) + 10;

                localStorage.setItem('mathIslandUser', JSON.stringify(user));
                updateProfileUI(user);

                generateGames();

                const activeFilterBtn = document.querySelector('.filter-btn.active-filter');
                const currentGrade = activeFilterBtn ? activeFilterBtn.id.split('-')[1] : '1';
                filterGrade(currentGrade);
            }

            closeGameModal();
        });
    }
});