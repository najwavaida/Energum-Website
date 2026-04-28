🌿 EnerGum – Smart Recommendation System

EnerGum adalah aplikasi berbasis web yang mengintegrasikan Machine Learning, Backend, dan Frontend untuk memberikan rekomendasi cerdas berbasis data.

🚀 Cara Menjalankan Project

Ikuti langkah-langkah berikut untuk menjalankan seluruh sistem secara lokal:

🧠 1. Menjalankan ML Service
cd ml_service
python -m venv .venv

Aktivasi virtual environment (Windows):

.\.venv\Scripts\Activate.ps1

Install dependency:

pip install -r requirements.txt

Training model:

python train_tf.py

Menjalankan API:

uvicorn app:app --reload --port 8000

📌 API Documentation (Swagger):
👉 http://127.0.0.1:8000/docs

⚙️ 2. Menjalankan Backend
cd backend
npm install
node server.js
💻 3. Menjalankan Frontend
npm install
npm run dev
🧩 Arsitektur Project
🧠 ML Service → Model Machine Learning (TensorFlow / FastAPI)
⚙️ Backend → API & logic server (Node.js)
💻 Frontend → Tampilan user (React / Vite)
