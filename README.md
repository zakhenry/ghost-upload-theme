# Ghost upload theme

Using [TryGhost/Ghost](https://github.com/TryGhost/Ghost) and customizing some themes for your website?

If you'd like to automate the upload of the new or updated theme as part of a CI task for example, this package is what you're looking for.

# How to use the CLI

```
yarn global add ghost-upload-theme

ghost-upload-theme
    --theme-path ./path/to/your/theme.zip
    --environment-path ./path/to/your/env/.env
    --routes-path ./path/to/your/routes.yaml
    --content-path ./path/to/your/exported/content*.json
    --init # use this if the ghost install is completely fresh, no users created
```
