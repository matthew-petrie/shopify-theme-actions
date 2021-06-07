# Shopify Theme Actions

A set of GitHub Actions to enable fast Shopify theme development workflows:

**DEPLOYMENT_PREVIEW**  
Creates a new Shopify theme for each PR. If a PR specific theme already exists it will be updated (i.e. on a `git push` after the PR was created).

**DEPLOY**  
Deploys to the specified Shopify theme, useful for defined, testing / staging / production themes.

## Requirements
Requires a Shopify Private App to be created with the permissions:
* `Themes`: `Read and write`

## Inputs

### `ACTION`

**Required** 'DEPLOYMENT_PREVIEW' (creates a PR specific Shopify theme), 'DEPLOY' (deploys to a specified theme, 'SHOPIFY_THEME_ID' must also be set)

### `SHOPIFY_STORE_URL`
*Should be stored as a GitHub secret!*  

**Required** The shopify development store i.e. my-store.myshopify.com  

### `SHOPIFY_PASSWORD`
*Should be stored as a GitHub secret!*  

**Required** The Shopify store's private app password used with themekit

### `SHOPIFY_API_KEY`
*Should be stored as a GitHub secret!*  

**Required** The Shopify store's private app API Key to allow theme creation and removal

### `SHOPIFY_THEME_ID`

**Optional** The Shopify theme that will be deployed to (only used if 'ACTION' is 'DEPLOY')

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
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          # Make sure the actual branch is checked out when running on pull requests
          ref: ${{ github.head_ref }}

      # ... steps to build theme ...

      - uses: matthew-petrie/shopify-theme-actions@v0.0.1
        with:
          ACTION: "DEPLOYMENT_PREVIEW"
          SHOPIFY_STORE_URL: ${{secrets.SHOPIFY_STORE_URL}}
          SHOPIFY_PASSWORD: ${{secrets.SHOPIFY_PASSWORD}}
          SHOPIFY_API_KEY: ${{secrets.SHOPIFY_API_KEY}}
```