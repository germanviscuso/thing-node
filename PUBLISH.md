##Register user with npm (only once)
```
$ npm set init.author.name "Your Name"
$ npm set init.author.email "you@example.com"
$ npm set init.author.url "http://yourblog.com"
$ npm adduser
```

##Freeze package dependency structure
Semantic versioning introduces dependency problems to maintain the package
In order to avoid this, when tests are green do:
```
npm shrinkwrap --dev
```

##Bump version, push to git and publish on npm
```
$ git add
$ npm version [<newversion> | major | minor | patch] -m "Your commit message"
$ git push --follow-tags
# ATTENTION: There is no turning back here.
$ npm publish
```

