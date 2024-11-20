.PHONY: docker-build-dev
docker-build:
	docker build -t user_service:0.1 . --ssh default=../sshkeys
