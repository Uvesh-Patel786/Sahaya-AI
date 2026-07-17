from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.rag import ingest_knowledge_dir
from app.routes import router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        result = ingest_knowledge_dir()
        print(f"Knowledge ingest: {result}")
    except Exception as exc:
        print(f"Knowledge ingest skipped: {exc}")
    yield


app = FastAPI(title="Sahayak AI Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health")
def root_health():
    return {"ok": True, "service": "sahayak-ai"}
