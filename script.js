import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2';
env.allowLocalModels = false;

/* ==========================================================
   Етап 1: DOM/BOM (SPA, Годинник, Navigator)
   ========================================================== */
function updateClock() {
    const clock = document.getElementById('live-clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString('uk-UA');
}
setInterval(updateClock, 1000);
updateClock();

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.page-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        sections.forEach(sec => {
            sec.style.display = 'none';
            if (sec.id === target) sec.style.display = 'block';
        });
    });
});

document.getElementById('browser-info').innerHTML = 
    `Платформа: <b>${navigator.platform}</b> | Браузер: <b>${navigator.userAgent.split(' ')[0]}</b>`;

/* ==========================================================
   Етап 2: робота з даними (Завантаження з db.json)
   ========================================================== */
let productsDB = [];
const productsList = document.getElementById('products-list');

async function loadDatabase() {
    try {
        const response = await fetch('db.json');
        if (!response.ok) throw new Error(`Статус ${response.status}`);
        productsDB = await response.json();
        renderProducts(productsDB);
    } catch (error) {
        productsList.innerHTML = `<p style="color:#f85149; font-weight:bold;">Помилка завантаження бази даних: ${error.message}</p>`;
    }
}

loadDatabase();

function renderProducts(data) {
    productsList.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = item.id;
        
        const shortDesc = item.desc.split('. ')[1] || item.desc; 

        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}" class="product-img">
            <div class="product-info">
                <h3>${item.name}</h3>
                <p style="color: var(--accent); font-weight: bold; margin: 5px 0;">${item.price} грн</p>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom: 10px;">${shortDesc}</p>
                <button class="btn-add" data-action="buy">У кошик</button>
            </div>
        `;
        productsList.appendChild(card);
    });
}

function applyFilters() {
    const query = document.getElementById('catalog-search').value.toLowerCase();
    const cat = document.getElementById('category-filter').value;
    const filtered = productsDB.filter(p => {
        return p.name.toLowerCase().includes(query) && (cat === 'all' || p.category === cat);
    });
    renderProducts(filtered);
}
document.getElementById('catalog-search').addEventListener('input', applyFilters);
document.getElementById('category-filter').addEventListener('change', applyFilters);

/* ==========================================================
   Етап 3-4: Кошик, Валідація, LocalStorage
   ========================================================== */
let basket = JSON.parse(localStorage.getItem('user_basket')) || [];

productsList.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const product = productsDB.find(p => p.id === parseInt(card.dataset.id));

    if (e.target.dataset.action === 'buy') {
        e.stopPropagation();
        basket.push(product);
        updateBasket();
        alert(`Додано: ${product.name}`);
    } else {
        const modal = document.getElementById('product-modal');
        document.getElementById('modal-body').innerHTML = `
            <img src="${product.img}" style="width:100%; border-radius:8px">
            <h2 style="margin:15px 0; color:white;">${product.name}</h2>
            <p style="font-size:1.4rem; color:var(--accent); font-weight:bold;">${product.price} грн</p>
            <p style="color:white; margin-top:10px; line-height:1.5;">${product.desc}</p>
        `;
        modal.style.display = 'flex';
    }
});

document.querySelector('.close-modal').onclick = () => document.getElementById('product-modal').style.display = 'none';
window.onclick = (e) => { if (e.target == document.getElementById('product-modal')) document.getElementById('product-modal').style.display = 'none'; };

document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('f-phone').value;
    if (!/^\+380\d{9}$/.test(phone)) {
        document.getElementById('err-phone').style.display = 'block';
    } else {
        document.getElementById('err-phone').style.display = 'none';
        alert('Запит відправлено! Дякуємо.');
        e.target.reset();
    }
});

function updateBasket() {
    localStorage.setItem('user_basket', JSON.stringify(basket));
    const container = document.getElementById('basket-container');
    const stats = document.getElementById('stats-area');

    if (basket.length === 0) {
        container.innerHTML = '<p id="empty-basket-msg">Кошик порожній.</p>';
        stats.classList.add('hidden');
        return;
    }

    stats.classList.remove('hidden');
    container.innerHTML = '';
    basket.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'basket-item';
        div.innerHTML = `<span style="color:white;">${item.name} (${item.price} грн)</span> 
            <button onclick="removeFromBasket(${idx})" style="background:#f85149; border:none; color:white; padding:4px 10px; border-radius:4px; cursor:pointer">Видалити</button>`;
        container.appendChild(div);
    });

    document.getElementById('total-count').textContent = basket.length;
    document.getElementById('total-price').textContent = basket.reduce((acc, curr) => acc + curr.price, 0);
}
window.removeFromBasket = (idx) => { basket.splice(idx, 1); updateBasket(); };
updateBasket();

// DEMO Вузлів DOM
const demoArea = document.getElementById('dom-demo');
const demoDiv = document.createElement('div'); 
demoDiv.style.color = 'var(--accent)';
demoDiv.append(document.createTextNode('Динамічний текстовий вузол створено.'), document.createComment('Коментар.'));
demoArea.append(demoDiv);

/* ==========================================================
   Погода (API)
   ========================================================== */
async function fetchWeather() {
    try {
        const response = await fetch('https://wttr.in/Ivano-Frankivsk?format=j1');
        const data = await response.json();
        const pressure = data.current_condition[0].pressure; 
        const wind = data.current_condition[0].windspeedKmph;

        document.getElementById('weather-data').innerHTML = `
            <div class="info-row"><span>Атмосферний тиск</span> <b style="color:white;">${pressure} гПа</b></div>
            <div class="info-row"><span>Швидкість вітру</span> <b style="color:white;">${wind} км/год</b></div>
            <p style="color: var(--success); font-size: 0.8rem; margin-top:10px;">Дані успішно отримані через Fetch API.</p>
        `;
    } catch (e) {
        document.getElementById('weather-data').innerHTML = '<div class="info-row">Помилка з\'єднання.</div>';
    }
}
document.querySelector('[data-target="about"]').addEventListener('click', fetchWeather, { once: true });


/* ==========================================================
   ШІ Асистент (Local DB + Wiki + SmolLM2 + Перекладач)
   ========================================================== */
let aiGenerator = null;
let isAiLoaded = false;
const chatArea = document.getElementById('chat-area');
const aiBtn = document.getElementById('ai-widget-btn');
const aiWin = document.getElementById('ai-window');

aiBtn.onclick = () => {
    aiWin.style.display = aiWin.style.display === 'flex' ? 'none' : 'flex';
    if (!isAiLoaded && aiWin.style.display === 'flex') initAI();
};
document.getElementById('close-chat').onclick = () => aiWin.style.display = 'none';

async function initAI() {
    if (isAiLoaded) return;
    const loadMsg = document.createElement('div');
    loadMsg.className = 'msg ai';
    loadMsg.innerHTML = '<i>Завантажую ШІ-модель... Це займе хвилинку.</i>';
    chatArea.appendChild(loadMsg);

    try {
        aiGenerator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-360M-Instruct');
        isAiLoaded = true;
        loadMsg.innerHTML = '<b>ШІ готовий. Я знаю весь каталог магазину та можу спілкуватись українською! Що підказати?</b>';
    } catch (e) {
        loadMsg.innerHTML = '<b style="color:#f85149">Помилка завантаження моделі. Перевірте консоль.</b>';
    }
}

// ---------------------------------------------------------
// Секретний REST API Перекладач (MyMemory API)
// ---------------------------------------------------------
async function translateText(text, langPair) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.responseData.translatedText;
    } catch (e) {
        console.error("Translation error", e);
        return text; 
    }
}

async function translateToEng(text) { return await translateText(text, "uk|en"); }
async function translateToUkr(text) { return await translateText(text, "en|uk"); }

// ---------------------------------------------------------
// Зовнішній пошук по Вікіпедії
// ---------------------------------------------------------
async function getFishingWikiContext(text) {
    try {
        const query = encodeURIComponent(text + " fishing");
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.query && data.query.search.length > 0) {
            return data.query.search[0].snippet.replace(/(<([^>]+)>)/gi, "");
        }
        return "No external info found.";
    } catch(e) { return "API error."; }
}

// ---------------------------------------------------------
// Головна функція генерації (Оркестрація)
// ---------------------------------------------------------
async function generateAIResponse(text, isExcuse = false) {
    if (!isAiLoaded) return;

    chatArea.insertAdjacentHTML('beforeend', `<div class="msg user">${text}</div>`);
    chatArea.scrollTop = chatArea.scrollHeight;
    
    const typing = document.createElement('div');
    typing.className = 'msg ai';
    typing.innerHTML = '<i>Аналізую та перекладаю...</i>';
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const engQuery = isExcuse ? "Give me a funny excuse for buying a new fishing rod." : await translateToEng(text);

        let prompt = "";
        if (isExcuse) {
            prompt = `<|im_start|>system\nYou are a funny fishing excuse generator. Reply in exactly 1 short sentence in English. User bought a new fishing rod.<|im_end|>\n<|im_start|>user\n${engQuery}<|im_end|>\n<|im_start|>assistant\n`;
        } else {
            const dbContext = productsDB.map(p => `${p.name}: ${p.price} UAH`).join(" | ");
            const wikiContext = await getFishingWikiContext(engQuery);
            // ОНОВЛЕНИЙ ПРОМПТ (ШІ вважає себе магазином)
            prompt = `<|im_start|>system\nYou are the official AI representative of the FishPro store. Speak on behalf of the store (use "we", "our"). If the user asks "do you have", check the Store Catalog.\nStore Catalog: ${dbContext}\nExternal Knowledge: ${wikiContext}\nRULES:\n1. If recommending a product, ONLY suggest items from the Store Catalog. Mention the price.\n2. Keep answers short (1-2 sentences). Reply in English.<|im_end|>\n<|im_start|>user\n${engQuery}<|im_end|>\n<|im_start|>assistant\n`;
        }

        const out = await aiGenerator(prompt, { max_new_tokens: 150, temperature: 0.1, return_full_text: false });
        let generatedEngText = out[0].generated_text.trim();

        if (generatedEngText.includes('<|im_start|>assistant')) {
            generatedEngText = generatedEngText.split('<|im_start|>assistant').pop().trim();
        }
        if (generatedEngText.includes('Store Catalog:')) {
            generatedEngText = generatedEngText.split('RULES:')[1] || generatedEngText;
        }

        const finalUkrText = await translateToUkr(generatedEngText);

        typing.remove();
        chatArea.insertAdjacentHTML('beforeend', `<div class="msg ai">${isExcuse ? '<b>Відмазка:</b> ' : ''}${finalUkrText}</div>`);
    } catch (e) {
        typing.remove();
        chatArea.insertAdjacentHTML('beforeend', `<div class="msg ai" style="color:#f85149;">Сталася помилка обробки.</div>`);
        console.error(e);
    }
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ---------------------------------------------------------
// Обробники подій
// ---------------------------------------------------------
document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.onclick = () => {
        const question = btn.getAttribute('data-q');
        generateAIResponse(question, question.includes('Відмазка'));
    };
});

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');

// Відправка по кліку
sendBtn.onclick = () => {
    const text = chatInput.value.trim();
    if (text) {
        generateAIResponse(text);
        chatInput.value = '';
    }
};

chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const text = chatInput.value.trim();
        if (text) {
            generateAIResponse(text);
            chatInput.value = '';
        }
    }
});