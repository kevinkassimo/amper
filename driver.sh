#!/bin/bash

[ -d drivers ] && exit 0

mkdir drivers

cd drivers

echo ">>> Install drivers..."

curl -L http://chromedriver.storage.googleapis.com/2.41/chromedriver_mac64.zip -o chromedriver.zip
unzip chromedriver.zip && rm chromedriver.zip
echo ">>> Added Chrome"
curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-macos.tar.gz -o geckodriver.tar.gz
tar -xzf geckodriver.tar.gz && rm geckodriver.tar.gz
echo ">>> Added Firefox"

{ [[ $(uname) != 'Darwin' ]] && echo ">>> Skipping Safari (macOS only)"; } || echo ">>> Safari supported by default"