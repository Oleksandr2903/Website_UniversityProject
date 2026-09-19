# FishPro: E-Commerce SPA with On-Device AI Assistant

A feature-rich Single Page Application (SPA) e-commerce storefront built entirely with **Vanilla JavaScript**. This project demonstrates advanced front-end capabilities without relying on heavy frameworks like React or Vue.

## 🚀 Key Features

* **On-Device AI Assistant (RAG):** Integrates Hugging Face's `Transformers.js` to run the `SmolLM2-360M-Instruct` LLM entirely in the browser. It uses a custom Retrieval-Augmented Generation (RAG) pipeline to inject the store's product catalog and external Wikipedia data directly into the AI's context.
* **SPA Routing:** Client-side navigation system with dynamic DOM rendering and view switching.
* **State Management:** Shopping cart logic persisting via browser `LocalStorage`.
* **External APIs:** Real-time weather data fetching via the `wttr.in` API.
* **Form Validation:** Regex-based validation for user input fields.

## 🛠 Technical Stack
* **HTML5 & CSS3:** Semantic markup, CSS Variables, Flexbox/Grid layouts.
* **Vanilla JavaScript (ES6+):** Async/Await, Fetch API, DOM manipulation.
* **Transformers.js:** WebGL-accelerated local machine learning inference.

## 📦 How to Run Locally

Since this project uses ES6 modules and the Fetch API, it must be served over an HTTP server (opening `index.html` directly via `file://` protocol will result in CORS errors).

1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/Website_UniversityProject.git](https://github.com/your-username/Website_UniversityProject.git)
   cd Website_UniversityProject
