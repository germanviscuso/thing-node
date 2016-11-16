##Increase version in package.json and
```
$ npm install
$ git commit
$ git tag <PACKAGE_VERSION> <COMMIT_ID>
$ git push origin master --tags
$ npm publish
```

##As recommended by Yeoman's generator-node:
```
$ npm version major
$ git push --follow-tags
# ATTENTION: There is no turning back here.
$ npm publish
```
##Freezing package dependency structure
Semantic versioning introduces dependency problems to maintain the package
In order to avoid this when tests are green do:
```
npm shrinkwrap --dev
```