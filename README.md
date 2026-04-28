Cara menjalankan project EnerGum:

1. Jalankan ML service:
   ``cd ml_service``
   ``python -m venv .venv``
   ``.\.venv\Scripts\Activate.ps1 (Windows)``
  `` pip install -r requirements.txt``
   ``python train_tf.py``
   ``uvicorn app:app --reload --port 8000``
2. Jalankan backend:
 ``cd backend``
   ``npm install``
   ``node server.js``
3. Jalankan frontend:
   ``npm install``
   ``npm run dev``

api swagger http://127.0.0.1:8000/docs
