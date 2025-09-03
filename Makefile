SHELL := /usr/bin/bash

.DEFAULT_GOAL := help

ROOT := $(CURDIR)
COMPOSE_SIMPLE := $(ROOT)/docker-compose.simple.yml
COMPOSE_FULL := $(ROOT)/docker-compose.yml
COMPOSE_PROD := $(ROOT)/docker-compose.prod.yml
# Авто-детект: сначала пробуем docker compose, иначе docker-compose
COMPOSE_CMD := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo "docker compose"; fi)
PNPM := pnpm


.PHONY: help install dev build start lint typecheck \
	start-db start-stack stop logs-db logs-minio \
	db-generate db-migrate db-seed db-studio check-pnpm \
	first-run db-push db-reset format test db-studio-open env-check \
	docker-access prod-build prod-up prod-down prod-logs

help:
	@echo "Доступные команды:"
	@echo "  make install         - установить зависимости workspace (pnpm install)"
	@echo "  make dev             - запустить Next.js dev сервер (@zv/web)"
	@echo "  make build           - собрать приложение"
	@echo "  make start           - запустить prod сервер"
	@echo "  make lint            - проверить eslint"
	@echo "  make typecheck       - проверить типы"
	@echo "  -- Инфраструктура --"
	@echo "  make start-db        - поднять только PostgreSQL (simple compose)"
	@echo "  make start-stack     - поднять БД + Minio (полный compose)"
	@echo "  make stop            - остановить все контейнеры compose"
	@echo "  make logs-db         - логи PostgreSQL"
	@echo "  make logs-minio      - логи Minio"
	@echo "  -- Drizzle ORM --"
	@echo "  make db-generate     - сгенерировать миграции (drizzle-kit generate)"
	@echo "  make db-migrate      - применить миграции (drizzle-kit migrate)"
	@echo "  make db-seed         - заполнить тестовыми данными"
	@echo "  make db-push         - синхронизировать схему в БД (drizzle-kit push)"
	@echo "  make db-studio       - открыть Drizzle Studio (CLI)"
	@echo "  make db-studio-open  - открыть Drizzle Studio и браузер"
	@echo "  -- Прочее --"
	@echo "  make first-run       - первый запуск: install → stack → migrate → seed"
	@echo "  make db-reset        - очистить БД (drop/create public)"
	@echo "  make format          - авто-исправление линтом (web)"
	@echo "  make test            - запустить тесты (если настроены)"
	@echo "  make docker-access   - настроить доступ к Docker без sudo (требует sudo)"
	@echo "  -- Продакшен --"
	@echo "  make prod-build      - собрать Docker образ для продакшена"
	@echo "  make prod-up         - запустить продакшен стек"
	@echo "  make prod-down       - остановить продакшен стек"
	@echo "  make prod-logs       - показать логи продакшен приложения"

STUDIO_PORT ?= 4983
NEXT_PORT ?= 3000

check-pnpm:
	@command -v $(PNPM) >/dev/null 2>&1 || { echo "pnpm не установлен. См. https://pnpm.io/installation"; exit 1; }

install: check-pnpm
	$(PNPM) install

dev: check-pnpm start-stack
	$(PNPM) run dev

build: check-pnpm
	$(PNPM) run build

start: check-pnpm
	$(PNPM) run start

lint: check-pnpm
	$(PNPM) run lint

typecheck: check-pnpm
	$(PNPM) run typecheck

start-db:
	$(COMPOSE_CMD) -f $(COMPOSE_SIMPLE) up -d --remove-orphans

start-stack:
	@echo "Запускаю инфраструктуру (PostgreSQL + MinIO)..."
	$(COMPOSE_CMD) -f $(COMPOSE_FULL) up -d --remove-orphans
	@echo "Инфраструктура запущена."


stop:
	@echo "Останавливаю Docker стеки..."
	@$(COMPOSE_CMD) -f $(COMPOSE_FULL) down --remove-orphans || sudo -n $(COMPOSE_CMD) -f $(COMPOSE_FULL) down --remove-orphans || true
	@$(COMPOSE_CMD) -f $(COMPOSE_SIMPLE) down --remove-orphans || sudo -n $(COMPOSE_CMD) -f $(COMPOSE_SIMPLE) down --remove-orphans || true
	@echo "Останавливаю локальные процессы (Next dev, Drizzle Studio)..."
	@if command -v fuser >/dev/null 2>&1; then \
		fuser -k -n tcp $(NEXT_PORT) >/dev/null 2>&1 || true; \
	elif command -v lsof >/dev/null 2>&1; then \
		PIDS=$$(lsof -ti tcp:$(NEXT_PORT)); [ -z "$$PIDS" ] || kill -9 $$PIDS || true; \
	fi
	@if command -v fuser >/dev/null 2>&1; then \
		fuser -k -n tcp $(STUDIO_PORT) >/dev/null 2>&1 || true; \
	elif command -v lsof >/dev/null 2>&1; then \
		PIDS=$$(lsof -ti tcp:$(STUDIO_PORT)); [ -z "$$PIDS" ] || kill -9 $$PIDS || true; \
	fi
	-@pkill -f "drizzle-kit studio" >/dev/null 2>&1 || true
	-@pkill -f "next dev" >/dev/null 2>&1 || true
	@echo "Готово."

docker-access:
	@echo "Добавляю пользователя '$$USER' в группу 'docker' (понадобится пароль sudo)..."
	sudo groupadd docker || true
	sudo usermod -aG docker $$USER
	@echo "Проверяю сокет Docker и права..."
	@if [ -S /var/run/docker.sock ]; then \
		sudo chgrp docker /var/run/docker.sock || true; \
		sudo chmod 660 /var/run/docker.sock || true; \
	fi
	@echo "Перезапускаю демон Docker (если есть systemd)..."
	sudo systemctl restart docker || true
	@echo "Готово. Чтобы изменения вступили в силу, выполните ОДНО из действий:" \
		"\n  1) Выйдите из сессии и войдите снова (предпочтительно)," \
		"\n  2) Или выполните: newgrp docker" \
		"\nПосле этого проверьте: docker ps"

.PHONY: stop-docker-sudo
stop-docker-sudo:
	sudo $(COMPOSE_CMD) -f $(COMPOSE_FULL) down --remove-orphans || true
	sudo $(COMPOSE_CMD) -f $(COMPOSE_SIMPLE) down --remove-orphans || true

logs-db:
	docker logs -f zv_postgres

logs-minio:
	docker logs -f zv_minio

db-generate: check-pnpm
	$(PNPM) run db:generate

db-migrate: check-pnpm
	$(PNPM) run db:migrate

db-seed: check-pnpm
	$(PNPM) run db:seed

db-studio: check-pnpm
	$(PNPM) run db:studio

db-push: check-pnpm
	$(PNPM) --filter db run db:push

env-check:
	@if [ -z "$$DATABASE_URL" ]; then \
		echo "[warn] DATABASE_URL не установлен в окружении. Drizzle возьмёт его из .env пакета @zv/db, если он есть."; \
	fi

first-run: install start-stack env-check db-generate db-migrate db-seed
	@echo "Первоначальная настройка завершена. Запустите dev сервер: make dev"

db-reset: start-stack
	@echo "Сброс схемы public в контейнере zv_postgres..."
	@docker exec zv_postgres psql -U zv_user -d zvezdnoe_vereteno -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" \
		&& echo "Готово. Теперь применяю миграции..." \
		&& $(MAKE) db-migrate \
		&& $(MAKE) db-seed

format: check-pnpm
	# Авто-исправление eslint в приложении web
	$(PNPM) --filter web run lint -- --fix || true

test: check-pnpm
	# Запуск тестов по всем пакетам, если настроены
	$(PNPM) -r run test || echo "Тесты не настроены в workspace"

db-studio-open: check-pnpm
	# Запуск Studio на фиксированном порту и авто-открытие браузера (Linux)
	$(PNPM) --filter db exec drizzle-kit studio --port $(STUDIO_PORT) & \
		sleep 1 && xdg-open http://127.0.0.1:$(STUDIO_PORT) >/dev/null 2>&1 || true

# === ПРОДАКШЕН КОМАНДЫ ===
prod-build:
	@echo "Собираю Docker образ для продакшена..."
	docker build -t zvezdnoe-vereteno:latest .
	@echo "Образ собран: zvezdnoe-vereteno:latest"

prod-up:
	@echo "Запускаю продакшен стек..."
	@if [ ! -f .env.prod ]; then \
		echo "Создайте .env.prod файл на основе env.prod.example"; \
		echo "cp env.prod.example .env.prod"; \
		echo "Затем отредактируйте .env.prod с вашими настройками"; \
		exit 1; \
	fi
	$(COMPOSE_CMD) -f $(COMPOSE_PROD) --env-file .env.prod up -d
	@echo "Продакшен стек запущен"

prod-down:
	@echo "Останавливаю продакшен стек..."
	$(COMPOSE_CMD) -f $(COMPOSE_PROD) down --remove-orphans
	@echo "Продакшен стек остановлен"

prod-logs:
	$(COMPOSE_CMD) -f $(COMPOSE_PROD) logs -f web


