.PHONY: docker-build-dev
docker-build:
	docker build -t amitharwani/bookkeeping_repo/user_service:0.1 . --ssh default=../sshkeys
