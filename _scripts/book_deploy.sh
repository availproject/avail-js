#!/bin/bash

cd ./documentation
mdbook build
cd ..
rm -rf ./docs
mv ./documentation/book/html ./docs
