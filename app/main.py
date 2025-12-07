from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import builder, renderer, submission, upload

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dynamic Form Engine API",
    description="A comprehensive form builder with conditional logic, multi-page support, and field dependencies",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(builder.router, prefix="/api/v1/builder", tags=["Form Builder"])
app.include_router(renderer.router, prefix="/api/v1/renderer", tags=["Form Renderer"])
app.include_router(submission.router, prefix="/api/v1/submission", tags=["Form Submission"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["File Upload"])


@app.get("/")
async def root():
    return {
        "message": "Dynamic Form Engine API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


