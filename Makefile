setup:
	@npm install --global rollup

.PHONY: build
build:
	./node_modules/.bin/rollup -c

pretty:
	@npx prettier ./src --write
	
lint:
	npx eslint ./src --fix

check:
	@echo "Typechecking Js"
	./node_modules/.bin/tsc

test-server:
	@npx  wds --node-resolve --open --watch --app-index test/index.html