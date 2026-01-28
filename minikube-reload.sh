#!/bin/bash

# Build and reload docker images FOR MINKUBE TESTING ENVIRONMENT

eval $(minikube docker-env)
docker build -t smanzy-frontend:latest .
cd ..
cd smanzy_backend
docker build -t smanzy-backend:latest .
cd ..
cd smanzy_thumbnailer
docker build -t smanzy-thumbnailer:latest .
cd ..
cd smanzy_postgres
docker build -t smanzy-postgres:latest .    

cd ..
kubectl rollout restart deployment/frontend -n smanzy
kubectl rollout restart deployment/backend -n smanzy
kubectl rollout restart deployment/thumbnailer -n smanzy
kubectl rollout restart deployment/postgres -n smanzy