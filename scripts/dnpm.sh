#!/bin/bash
# Check if container is running
if [ -z "$(docker ps -q -f name=expo-app)" ]; then
    echo "Starting container..."
    docker-compose up -d
fi
# Run command
docker-compose exec expo-app npm "$@"