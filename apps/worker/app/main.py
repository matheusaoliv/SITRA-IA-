from fastapi import FastAPI

app = FastAPI(title="SITRA IA Document Worker", version="0.1.0")

@app.get("/health")
def health():
    return {"service": "sitra-worker", "status": "ok"}

@app.get("/")
def root():
    return {"name": "SITRA IA", "purpose": "document processing and AI support", "decision_authority": "human"}
