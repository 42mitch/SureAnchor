#!/bin/bash
# Azure App Service startup script for the ML microservice.
# Set the MODELS_DIR environment variable in Azure App Service → Configuration
# to the absolute path where .pkl files are deployed (e.g. /home/site/wwwroot/models).

pip install -r /home/site/wwwroot/requirements.txt

cd /home/site/wwwroot

uvicorn main:app --host 0.0.0.0 --port 8000
