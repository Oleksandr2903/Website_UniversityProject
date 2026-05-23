import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';
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
    `Платформа: <b>${navigator.platform}</b> | Браузер: <b>${navigator.userAgent.split('/')[0]}</b>`;

/* ==========================================================
   Етап 2: Робота з даними (Масив, Генерація, Фільтрація)
   ========================================================== */
const productsDB = [
    { id: 1, name: "TextMaster AI", price: 1500, category: "text", desc: "Генерація текстів.", img: "https://picsum.photos/id/10/300/200" },
    { id: 2, name: "PixelArt AI", price: 3200, category: "image", desc: "Створення зображень.", img: "https://picsum.photos/id/20/300/200" },
    { id: 3, name: "VoiceBot XL", price: 2800, category: "voice", desc: "Клонування голосу.", img: "https://picsum.photos/id/30/300/200" },
    { id: 4, name: "DevAssist", price: 1100, category: "text", desc: "Помічник у коді.", img: "https://picsum.photos/id/40/300/200" },
    { id: 5, name: "DesignGen", price: 2000, category: "image", desc: "Створення макетів.", img: "https://picsum.photos/id/50/300/200" }
];

const productsList = document.getElementById('products-list');

function renderProducts(data) {
    productsList.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = item.id;
        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}" class="product-img">
            <div class="product-info">
                <h3>${item.name}</h3>
                <p class="product-price">${item.price} грн</p>
                <p style="font-size:0.8rem; color:#94a3b8">${item.desc}</p>
                <button class="btn-add" data-action="buy" style="margin-top:10px">В кошик</button>
            </div>
        `;
        productsList.appendChild(card);
    });
}
renderProducts(productsDB);

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
   Етап 3-4: Інтерактивність, кошик, форма, DOM DEMO
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
            <h2 style="margin:15px 0">${product.name}</h2>
            <p style="font-size:1.4rem; color:var(--success-color)">${product.price} грн</p>
        `;
        modal.style.display = 'flex';
    }
});

document.querySelector('.close-modal').onclick = () => document.getElementById('product-modal').style.display = 'none';

document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('f-phone').value;
    if (!/^\+380\d{9}$/.test(phone)) {
        document.getElementById('err-phone').style.display = 'block';
    } else {
        document.getElementById('err-phone').style.display = 'none';
        alert('Запит відправлено!');
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
        div.innerHTML = `<span>${item.name}</span> 
            <button onclick="removeFromBasket(${idx})" style="background:red; border:none; color:white; padding:3px 8px; cursor:pointer">X</button>`;
        container.appendChild(div);
    });

    document.getElementById('total-count').textContent = basket.length;
    document.getElementById('total-price').textContent = basket.reduce((acc, curr) => acc + curr.price, 0);
}
window.removeFromBasket = (idx) => { basket.splice(idx, 1); updateBasket(); };
updateBasket();

const demoDiv = document.createElement('div');
demoDiv.append(document.createTextNode('Динамічний текст.'), document.createComment('Коментар.'));
document.getElementById('dom-demo').append(demoDiv);

/* ==========================================================
   AI WIDGET (RAG + QWEN)
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
    loadMsg.innerHTML = '<i>Завантажую нейромережу (Qwen 0.5B)... Це займе хвилинку.</i>';
    chatArea.appendChild(loadMsg);

    try {
        aiGenerator = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat');
        isAiLoaded = true;
        loadMsg.innerHTML = '<b>ШІ завантажено! Напиши мені тему (англійською), і я зроблю підсумок з Вікіпедії.</b>';
    } catch (e) {
        loadMsg.innerHTML = '<b style="color:red">Помилка завантаження моделі.</b>';
    }
}

async function getHybridResponse(text) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(text)}&gsrlimit=1&prop=extracts&exchars=400&explaintext=1&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        let context = "";
        if (data.query && data.query.pages) {
            context = data.query.pages[Object.keys(data.query.pages)[0]].extract;
        }
        if (!context) return "I couldn't find info on Wikipedia.";

        const prompt = `<|im_start|>system\nYou are a strict summarizer. Summarize Context in exactly 2 sentences in English.\nContext: ${context}<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n<|im_start|>assistant\n`;
        const out = await aiGenerator(prompt, { max_new_tokens: 100, temperature: 0.1, return_full_text: false });
        return `✨ <strong>AI Summary:</strong><br>${out[0].generated_text.replace(/<\|im_end\|>/g, '').trim()}`;
    } catch (err) {
        return "Помилка RAG.";
    }
}

document.getElementById('chat-send').onclick = async function() {
    const inp = document.getElementById('chat-input');
    const text = inp.value.trim();
    if (!text || !isAiLoaded) return;

    chatArea.insertAdjacentHTML('beforeend', `<div class="msg user">${text}</div>`);
    inp.value = '';
    
    const typing = document.createElement('div');
    typing.className = 'msg ai';
    typing.innerHTML = '<i>Шукаю та аналізую...</i>';
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;

    const reply = await getHybridResponse(text);
    
    typing.remove();
    chatArea.insertAdjacentHTML('beforeend', `<div class="msg ai">${reply}</div>`);
    chatArea.scrollTop = chatArea.scrollHeight;
};