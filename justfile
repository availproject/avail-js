book-build:
    cd ./documentation && mdbook build
book-serve:
    cd ./documentation && mdbook serve
book-deploy:
    just book-build
    rm -rf ./docs
    mv ./documentation/book/html ./docs
book-publish:
    git diff --quiet
    git checkout gh-page
    git reset --hard main
    just book-deploy
    git add .
    git commit -m 'Book Deployed'
    git pf