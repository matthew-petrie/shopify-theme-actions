# Shopify Theme Actions

A set of GitHub Actions to enable fast Shopify theme development workflows:

**DEPLOYMENT_PREVIEW**  
Creates a new Shopify theme for each PR. If a PR specific theme already exists it will be updated (i.e. on a `git push` after the PR was created).

**DEPLOY**  
Deploys to the specified Shopify theme, useful for defined, testing / staging / production themes.

## PR Comments

After any deployment, if `GITHUB_TOKEN` is set, a comment will be added to the PR with a link to view the Shopify theme preview.

## Requirements

Requires a Shopify Private App to be created with the permissions:

- `Themes`: `Read and write`

## Inputs

### `ACTION`

**Required** 'DEPLOYMENT_PREVIEW' (creates a PR specific Shopify theme), 'DEPLOY' (deploys to a specified theme, 'SHOPIFY_THEME_ID' must also be set)

### `GITHUB_TOKEN`

**Required** Github authentication token that allows comments to be created on PRs

### `SHOPIFY_STORE_URL`

_Should be stored as a GitHub secret!_

**Required** The shopify development store i.e. my-store.myshopify.com

### `SHOPIFY_PASSWORD`

_Should be stored as a GitHub secret!_

**Required** The Shopify store's private app password used with themekit

### `SHOPIFY_API_KEY`

_Should be stored as a GitHub secret!_

**Required** The Shopify store's private app API Key to allow theme creation and removal

### `SHOPIFY_THEME_ID`

**Optional** The Shopify theme that will be deployed to (only used if 'ACTION' is 'DEPLOY')

### `SHOPIFY_THEME_KIT_FLAGS`

**Optional** Shopify Theme Kit flags for theme deployment in camelCase rather than hyphenated (i.e. `ignored-file` is `ignoredFile`) in the format: FLAG=VALUE,FLAG=VALUE i.e. `dir=./dist,allowLive=true`

See available flags here:

- [Global Flags](https://shopify.dev/tools/theme-kit/configuration-reference#command-line-flags)
- [Deployment Specific Flags](https://shopify.dev/tools/theme-kit/command-reference#deploy)

_Note: Use the `Long version` of the flatgs rather than short versions i.e. `nodelete` instead of `n`_

## Outputs

### `SHOPIFY_THEME_ID`

The newly created / found / supplied Shopify theme id

### `SHOPIFY_THEME_PREVIEW_URL`

The URL the theme can be previewed at

## Example usage

```
name: pull-request
on: [pull_request]
jobs:
  deploy_theme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          # Make sure the actual branch is checked out when running on pull requests
          ref: ${{ github.head_ref }}

      # ... steps to build theme ...

      - name: Shopify Theme Actions
        uses: matthew-petrie/shopify-theme-actions@0.0.4
        with:
          ACTION: "DEPLOYMENT_PREVIEW"
          SHOPIFY_STORE_URL: ${{secrets.SHOPIFY_STORE_URL}}
          SHOPIFY_PASSWORD: ${{secrets.SHOPIFY_PASSWORD}}
          SHOPIFY_API_KEY: ${{secrets.SHOPIFY_API_KEY}}
          SHOPIFY_THEME_KIT_FLAGS: "dir=./dist"
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```
