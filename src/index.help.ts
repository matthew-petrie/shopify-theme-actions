import * as github from "@actions/github";
import * as core from "@actions/core";
import {
  createReplaceComment,
  getPullRequestId,
  outputVariables,
  findIssueComment,
  retrieveShopifyThemeIdFromIssueComment,
  githubAuth,
  flagsObject,
  action,
} from "./github";
import {
  createOrFindThemeWithName,
  generateThemePreviewUrl,
  deployTheme,
  removeTheme,
  shopifyAuth,
} from "./shopify";
const UNIQUE_HIDDEN_COMMENT_STRING = "Comment created by GitHub Action `Shopify Theme Actions`";

export const removeDeploymentPreviewTheme = async (
  GITHUB_AUTH: githubAuth,
  SHOPIFY_AUTH: shopifyAuth
): Promise<void> => {
  if (!GITHUB_AUTH.token)
    throw new Error(`Cannot remove deployment preview theme as 'GITHUB_TOKEN' is not set.`);

  const githubContext = github.context;
  if (!githubContext.payload.pull_request) {
    throw new Error(
      `Cannot remove deployment preview theme as job is not running from within a pull request.`
    );
  }

  const octokit = github.getOctokit(GITHUB_AUTH.token);
  const comment = await findIssueComment(UNIQUE_HIDDEN_COMMENT_STRING, githubContext, octokit);

  if (comment && comment.body) {
    const shopifyThemeId = retrieveShopifyThemeIdFromIssueComment(comment.body);
    if (shopifyThemeId) await removeTheme(shopifyThemeId, SHOPIFY_AUTH);
  } else core.error(`Cannot find the last deployment preview comment so no theme can be removed.`);
};

export const deploymentPreview = async (
  ACTION: action,
  SHOPIFY_AUTH: shopifyAuth,
  GITHUB_AUTH: githubAuth,
  SHOPIFY_THEME_KIT_FLAGS: flagsObject | undefined
): Promise<void> => {
  const pullRequestNumber = getPullRequestId();
  const shopifyThemeName = `PR ${pullRequestNumber} - deployment preview`;
  const { shopifyTheme } = await createOrFindThemeWithName(shopifyThemeName, SHOPIFY_AUTH);
  await deployment(SHOPIFY_AUTH, GITHUB_AUTH, SHOPIFY_THEME_KIT_FLAGS, shopifyTheme.id);
};

export const deployment = async (
  SHOPIFY_AUTH: shopifyAuth,
  GITHUB_AUTH: githubAuth,
  SHOPIFY_THEME_KIT_FLAGS: flagsObject | undefined,
  shopifyThemeId?: number
): Promise<void> => {
  if (!shopifyThemeId) {
    throw new Error(
      `'shopifyThemeId' is not set but is required in order to deploy the theme to Shopify (if using the 'DEPLOY' action make sure to set 'SHOPIFY_THEME_ID').`
    );
  }
  await deployTheme(shopifyThemeId, SHOPIFY_AUTH, SHOPIFY_THEME_KIT_FLAGS);

  const themePreviewUrl = generateThemePreviewUrl(shopifyThemeId, SHOPIFY_AUTH);

  outputVariables({
    SHOPIFY_THEME_ID: shopifyThemeId.toString(),
    SHOPIFY_THEME_PREVIEW_URL: themePreviewUrl,
  });

  const message = `:tada: Shopify theme has been deployed to theme id '${shopifyThemeId}' at '${SHOPIFY_AUTH.storeUrl}'. The theme can be previewed at: ${themePreviewUrl}`;
  await createReplaceComment(message, UNIQUE_HIDDEN_COMMENT_STRING, shopifyThemeId, GITHUB_AUTH);
};
