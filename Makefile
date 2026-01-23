# AIASpeech Makefile
# Convenient commands for Docker deployment

.PHONY: help build up down restart logs clean status shell

help:
	@echo "AIASpeech Docker Commands"
	@echo ""
	@echo "  make build         - Build Docker images"
	@echo "  make up            - Start containers"
	@echo "  make down          - Stop and remove containers"
	@echo "  make restart       - Restart containers"
	@echo "  make logs          - View all logs"
	@echo "  make logs-app      - View app logs only"
	@echo "  make logs-nginx    - View nginx logs only"
	@echo "  make status        - Show container status"
	@echo "  make shell         - Open shell in app container"
	@echo "  make clean         - Stop containers and remove volumes"
	@echo "  make rebuild       - Rebuild and restart everything"
	@echo "  make setup-env     - Create .env file from template"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-app:
	docker-compose logs -f aiaspeech

logs-nginx:
	docker-compose logs -f nginx

status:
	docker-compose ps

shell:
	docker-compose exec aiaspeech sh

clean:
	docker-compose down -v
	rm -rf logs/*

rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

setup-env:
	@if [ ! -f .env ]; then \
		cp .env.docker.example .env; \
		echo "Created .env file. Please edit it with your settings."; \
	else \
		echo ".env file already exists."; \
	fi
