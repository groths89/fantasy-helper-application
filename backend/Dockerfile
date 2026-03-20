# Use a slim Python image to keep the build light
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (needed for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements first (optimizes Docker caching)
COPY ./backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
# Copy the backend code
COPY ./backend/app /app/app

# Copy the automation scripts
COPY ../automation /app/automation

# Expose the port FastAPI runs on
EXPOSE 8000

# Start FastAPI with Uvicorn
# --proxy-headers: Crucial for working with Nginx Proxy Manager
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]