# GENEZA NEXUS v7.0 - Docker Container
FROM python:3.11.6-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Environment variables (defaults, override with docker-compose or -e)
ENV FLASK_APP=backend.py
ENV FLASK_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/nexus.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/health')"

# Run with gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "backend:app"]
