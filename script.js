import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2';
env.allowLocalModels = false;

/* ==========================================================
   Phase 1: DOM/BOM (SPA, Clock, Navigator)
   ========================================================== */
function updateClock() {
    const clock = document.getElementById('live-clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
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
    `Platform: <b>${navigator.platform}</b> | Browser: <b>${navigator.userAgent.split(' ')[0]}</b>`;

/* ==========================================================
   Phase 2: Data Handling (Fetch from db.json)
   ========================================================== */
let productsDB = [];
const productsList = document.getElementById('products-list');

async function loadDatabase() {
    try {
        const response = await fetch('db.json');
        if (!response.ok) throw new Error(`Status ${response.status}`);
        productsDB = await response.json();
        renderProducts(productsDB);
    } catch (error) {
        productsList.innerHTML = `<p style="color:#f85149; font-weight:bold;">Database loading error: ${error.message}</p>`;
    }
}

loadDatabase();

function renderProducts(data) {
    productsList.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = item.id;
        
        const shortDesc = item.desc.split('. ')[0] + '.' || item.desc; 

        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}" class="product-img">
            <div class="product-info">
                <h3>${item.name}</h3>
                <p style="color: var(--accent); font-weight: bold; margin: 5px 0;">${item.price} UAH</p>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom: 10px;">${shortDesc}</p>
                <button class="btn-add" data-action="buy">Add to Cart</button>
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
   Phase 3-4: Cart, Validation, LocalStorage
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
        alert(`Added: ${product.name}`);
    } else {
        const modal = document.getElementById('product-modal');
        document.getElementById('modal-body').innerHTML = `
            <img src="${product.img}" style="width:100%; border-radius:8px">
            <h2 style="margin:15px 0; color:white;">${product.name}</h2>
            <p style="font-size:1.4rem; color:var(--accent); font-weight:bold;">${product.price} UAH</p>
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
        alert('Request sent successfully! Thank you.');
        e.target.reset();
    }
});

function updateBasket() {
    localStorage.setItem('user_basket', JSON.stringify(basket));
    const container = document.getElementById('basket-container');
    const stats = document.getElementById('stats-area');

    if (basket.length === 0) {
        container.innerHTML = '<p id="empty-basket-msg">Cart is empty.</p>';
        stats.classList.add('hidden');
        return;
    }

    stats.classList.remove('hidden');
    container.innerHTML = '';
    basket.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'basket-item';
        div.innerHTML = `<span style="color:white;">${item.name} (${item.price} UAH)</span> 
            <button onclick="removeFromBasket(${idx})" style="background:#f85149; border:none; color:white; padding:4px 10px; border-radius:4px; cursor:pointer">Remove</button>`;
        container.appendChild(div);
    });

    document.getElementById('total-count').textContent = basket.length;
    document.getElementById('total-price').textContent = basket.reduce((acc, curr) => acc + curr.price, 0);
}
window.removeFromBasket = (idx) => { basket.splice(idx, 1); updateBasket(); };
updateBasket();

// DOM Node Demonstration
const demoArea = document.getElementById('dom-demo');
const demoDiv = document.createElement('div'); 
demoDiv.style.color = 'var(--accent)';
demoDiv.append(document.createTextNode('Dynamic text node created. '), document.createComment('Comment placeholder.'));
demoArea.append(demoDiv);

/* ==========================================================
   Weather (External API)
   ========================================================== */
async function fetchWeather() {
    try {
        const response = await fetch('https://wttr.in/Ivano-Frankivsk?format=j1');
        const data = await response.json();
        const pressure = data.current_condition[0].pressure; 
        const wind = data.current_condition[0].windspeedKmph;

        document.getElementById('weather-data').innerHTML = `
            <div class="info-row"><span>Atmospheric Pressure</span> <b style="color:white;">${pressure} hPa</b></div>
            <div class="info-row"><span>Wind Speed</span> <b style="color:white;">${wind} km/h</b></div>
            <p style="color: var(--success); font-size: 0.8rem; margin-top:10px;">Data successfully retrieved via Fetch API.</p>
        `;
    } catch (e) {
        document.getElementById('weather-data').innerHTML = '<div class="info-row">Connection error.</div>';
    }
}
document.querySelector('[data-target="about"]').addEventListener('click', fetchWeather, { once: true });

/* ==========================================================
   AI Assistant (Local Transformers.js + SmolLM2 + Wikipedia)
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
    loadMsg.innerHTML = '<i>Loading AI model... This will take a minute.</i>';
    chatArea.appendChild(loadMsg);

    try {
        aiGenerator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-360M-Instruct');
        isAiLoaded = true;
        loadMsg.innerHTML = '<b>AI is ready. I know the entire store catalog. What can I help you with?</b>';
    } catch (e) {
        loadMsg.innerHTML = '<b style="color:#f85149">Error loading model. Check console.</b>';
    }
}

// ---------------------------------------------------------
// External Wikipedia Context
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
// Orchestration & Generation
// ---------------------------------------------------------
async function generateAIResponse(text) {
    if (!isAiLoaded) return;

    chatArea.insertAdjacentHTML('beforeend', `<div class="msg user">${text}</div>`);
    chatArea.scrollTop = chatArea.scrollHeight;
    
    const typing = document.createElement('div');
    typing.className = 'msg ai';
    typing.innerHTML = '<i>Analyzing...</i>';
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        const dbContext = productsDB.map(p => `${p.name}: ${p.price} UAH`).join(" | ");
        const wikiContext = await getFishingWikiContext(text);
        
        const prompt = `<|im_start|>system\nYou are the official AI representative of the FishPro store. Speak on behalf of the store (use "we", "our"). If the user asks "do you have", check the Store Catalog.\nStore Catalog: ${dbContext}\nExternal Knowledge: ${wikiContext}\nRULES:\n1. If recommending a product, ONLY suggest items from the Store Catalog. Mention the price.\n2. Keep answers short (1-2 sentences). Reply in English.<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;

        const out = await aiGenerator(prompt, { max_new_tokens: 150, temperature: 0.1, return_full_text: false });
        let generatedText = out[0].generated_text.trim();

        if (generatedText.includes('<|im_start|>assistant')) {
            generatedText = generatedText.split('<|im_start|>assistant').pop().trim();
        }

        typing.remove();
        chatArea.insertAdjacentHTML('beforeend', `<div class="msg ai">${generatedText}</div>`);
    } catch (e) {
        typing.remove();
        chatArea.insertAdjacentHTML('beforeend', `<div class="msg ai" style="color:#f85149;">Processing error occurred.</div>`);
        console.error(e);
    }
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ---------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------
document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.onclick = () => {
        generateAIResponse(btn.getAttribute('data-q'));
    };
});

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');

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
