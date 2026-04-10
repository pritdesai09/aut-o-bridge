FROM python:3.11-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Create uploads directory
RUN mkdir -p static/uploads/photos

# Pre-download DeepFace models to avoid cold start delay
RUN python -c "from deepface import DeepFace; import numpy as np; img = np.ones((100,100,3), dtype=np.uint8)*128; DeepFace.analyze(img, actions=['emotion'], enforce_detection=False, silent=True)" || true

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]