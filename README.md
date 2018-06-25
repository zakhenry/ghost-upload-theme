# Ghost upload theme

Using [TryGhost/Ghost](https://github.com/TryGhost/Ghost) and customizing some themes for your website?

If you'd like to automate the upload of the new or updated theme as part of a CI task for example, this package is what you're looking for.

# How to use the CLI

WIP: It should be published soon as a node package. In the meantime you can clone, build and run it yourself:

```
git clone https://github.com/maxime1992/ghost-upload-theme.git
node dist/ghost-upload-theme.umd.js --theme-path ./path-to-your-theme.zip --environment-path ./path-to-your-environment.json
```
