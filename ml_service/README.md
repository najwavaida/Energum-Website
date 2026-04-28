# EnerGum ML Service (Starter)

Ini service Python (FastAPI) untuk **inference rekomendasi** berbasis model ML (dummy dulu).

## 1) Setup & run

### Windows (PowerShell)
```bash
cd ml_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train.py
uvicorn app:app --reload --port 8000
```

### Mac / Linux
```bash
cd ml_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train.py
uvicorn app:app --reload --port 8000
```

Cek:
- http://localhost:8000/health

## 2) Endpoint

### POST /predict
Payload minimal:
```json
{
  "profile": {"age": 25, "gender": "female", "activity": "moderate", "goal": "energy", "allergies": []},
  "source": "questionnaire"
}
```

Response:
```json
{
  "product": "peanut",
  "confidence": 0.78,
  "probs": {"cashew": 0.12, "peanut": 0.78, "both": 0.10},
  "debug": {"blocked": []}
}
```

## 3) Catatan penting
- **Alergi = hard rule.** Kalau user alergi peanut, output peanut akan diblok.
- Dataset ini dummy. Nanti kalau sudah ada data real dari Firebase, kamu tinggal export jadi CSV dan retrain.
