# Amper

This is an experiment of testing with concurrent multiple webdriver instances running.  
A mocha-like test framework is created to run the tests.

## How to run
Put your tests in `spec/**/*.js`.
```bash
yarn run install-drivers # install drivers
yarn run server # start server at localhost:8080, allowing accessing pages in pages/ folder
yarn start [--spec="file1,file2"] [--cap="firefox,chrome,safari"] # run tests
```