
# a phony dependency that can be used as a dependency to force builds
FORCE:

install:

build: FORCE
	yarn install

run:
	yarn start
