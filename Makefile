.PHONY: dev prod build clean

dev:
	docker-compose -f docker-compose.dev.yml up --build

prod:
	docker-compose up --build

build:
	docker-compose build

clean:
	docker-compose down -v
	docker system prune -f

logs:
	docker-compose logs -f

restart:
	docker-compose restart