#!/bin/bash
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='*/bin' --exclude='*/obj' --exclude='.env' /Users/apple/Desktop/applications/form-builder/ root@95.216.199.142:/opt/formrise/
ssh root@95.216.199.142 "cd /opt/formrise && docker compose -f docker-compose.prod.yml up -d --build"
