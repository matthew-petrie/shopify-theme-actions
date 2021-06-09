# Shopify Theme Actions

A set of GitHub Actions to enable fast Shopify theme development / review workflows, options:

1. Create & deploy a PR specific preview theme
2. Remove the PR specific preview theme once the PR is closed
3. Deploy to a specified Shopify theme

## PR Comments

After any deployment, if `GITHUB_TOKEN` is set & the deployment was triggered by a pull request, a comment will be added to the PR with a link to view the Shopify theme preview.

## Requirements

Requires a Shopify Private App to be created with the permissions:

- `Themes`: `Read and write`

## Inputs

### `ACTION`

**Required**  
Options:

1. `DEPLOYMENT_PREVIEW`  
   Creates a new Shopify theme for each PR raised. If a PR specific theme already exists it will be updated (i.e. on a `git push` after the PR was created).

2. `REMOVE_DEPLOYMENT_PREVIEW_THEME`  
   Removes a previously created PR specific Shopify theme that was created when `ACTION` was set to `DEPLOYMENT_PREVIEW`

3. `DEPLOY`  
   Deploys to the specified Shopify theme, useful for defined `testing` / `staging` / `production` themes. `SHOPIFY_THEME_ID` must be set.  
   _If deploying to the live Shopify stores theme include the flag `allowLive=true` in `SHOPIFY_THEME_KIT_FLAGS`._

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

_Note: Use the `Long version` of the flags rather than short versions i.e. `nodelete` instead of `n`_

## Outputs

### `SHOPIFY_THEME_ID`

The newly created / found / supplied Shopify theme id

### `SHOPIFY_THEME_PREVIEW_URL`

The URL the theme can be previewed at

## Example usage

When a pull request is opened / updated deploy a PR specific Shopify theme:

```yaml
name: Pull Request Created or Updated
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
        uses: matthew-petrie/shopify-theme-actions@1.0.0
        with:
          ACTION: "DEPLOYMENT_PREVIEW"
          SHOPIFY_STORE_URL: ${{secrets.SHOPIFY_STORE_URL}}
          SHOPIFY_PASSWORD: ${{secrets.SHOPIFY_PASSWORD}}
          SHOPIFY_API_KEY: ${{secrets.SHOPIFY_API_KEY}}
          SHOPIFY_THEME_KIT_FLAGS: "dir=./dist"
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

When a pull request is closed remove the PR specific Shopify theme:

```yaml
name: Pull Request Closed
on:
  pull_request:
    types: [closed]
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
        uses: matthew-petrie/shopify-theme-actions@1.0.0
        with:
          ACTION: "REMOVE_DEPLOYMENT_PREVIEW_THEME"
          SHOPIFY_STORE_URL: ${{secrets.SHOPIFY_STORE_URL}}
          SHOPIFY_PASSWORD: ${{secrets.SHOPIFY_PASSWORD}}
          SHOPIFY_API_KEY: ${{secrets.SHOPIFY_API_KEY}}
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```
