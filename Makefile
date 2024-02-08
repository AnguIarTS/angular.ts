setup:
	@npm install --global rollup

.PHONY: build
build:
	./node_modules/.bin/rollup -c