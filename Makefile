setup:
	@npm i
	@npm install --global rollup

.PHONY: build
build:
	./node_modules/.bin/rollup -c

pretty:
	@npx prettier ./src --write
	
lint:
	@npx eslint ./src --fix

check:
	@echo "Typechecking Js"
	./node_modules/.bin/tsc

test-server:
	@python3 -m http.server