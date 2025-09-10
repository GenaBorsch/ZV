#!/bin/bash

# Скрипт для сборки production образа с уникальными тегами
# Использование: ./docker/build-prod.sh

set -e

# Получаем git hash и timestamp
GIT_SHA=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +"%Y%m%d_%H%M%S")
IMAGE_TAG="zv-app:${GIT_SHA}_${BUILD_TIME}"

echo "🚀 Сборка production образа..."
echo "📊 GIT_SHA: $GIT_SHA"
echo "⏰ BUILD_TIME: $BUILD_TIME"
echo "🏷️ IMAGE_TAG: $IMAGE_TAG"

# Сборка с уникальными build args
docker build \
  -f docker/Dockerfile.prod \
  --build-arg GIT_SHA="$GIT_SHA" \
  --build-arg BUILD_TIME="$BUILD_TIME" \
  --build-arg CACHE_BUST="$GIT_SHA-$BUILD_TIME" \
  -t "$IMAGE_TAG" \
  -t "zv-app:latest" \
  .

echo "✅ Образ собран: $IMAGE_TAG"
echo "💡 Для EasyPanel используйте тег: $IMAGE_TAG"
