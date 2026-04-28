# 🌿 EnerGum – Smart Recommendation System

EnerGum adalah aplikasi berbasis web yang mengintegrasikan **Machine Learning, Backend, dan Frontend** untuk memberikan rekomendasi cerdas berbasis data.

---

## 🚀 Cara Menjalankan Project

Ikuti langkah-langkah berikut untuk menjalankan seluruh sistem secara lokal:

---

## 🧠 1. Menjalankan ML Service

```bash
cd ml_service
python -m venv .venv
```

### Aktivasi Virtual Environment (Windows)
```bash
.\.venv\Scripts\Activate.ps1
```

### Install Dependency
```bash
pip install -r requirements.txt
```

### Training Model
```bash
python train_tf.py
```

### Menjalankan API
```bash
uvicorn app:app --reload --port 8000
```

📌 **API Documentation (Swagger):**  
http://127.0.0.1:8000/docs

---

## ⚙️ 2. Menjalankan Backend

```bash
cd backend
npm install
node server.js
```

---

## 💻 3. Menjalankan Frontend

```bash
npm install
npm run dev
```

---

## 🧩 Arsitektur Project

- 🧠 **ML Service** → Model Machine Learning (TensorFlow / FastAPI)  
- ⚙️ **Backend** → API & logic server (Node.js)  
- 💻 **Frontend** → Tampilan user (React / Vite)  

---


## ✨ Tips

- Jalankan service secara berurutan: **ML → Backend → Frontend**
- Pastikan port tidak bentrok
- Jika error, cek dependency masing-masing service

---

## 👨‍💻 Author

Developed by **EnerGum Team 💚**
