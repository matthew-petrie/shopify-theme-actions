import {
  createReplaceComment,
  getActionInputs,
  getPullRequestId,
  handleError,
  outputVariables,
} from "./github";
import { createOrFindThemeWithName, generateThemePreviewUrl, deployTheme } from "./shopify";

const DEPLOYMENT_ACTIONS = new Set([`DEPLOY`, `DEPLOYMENT_PREVIEW`]);

async function run(): Promise<void> {
  const { SHOPIFY_AUTH, GITHUB_AUTH, SHOPIFY_THEME_ID, ACTION, SHOPIFY_THEME_KIT_FLAGS } =
    getActionInputs();

  let shopifyThemeId: number | undefined;
  if (ACTION === "DEPLOYMENT_PREVIEW") {
    const pullRequestNumber = getPullRequestId();
    const shopifyThemeName = `PR ${pullRequestNumber} - deployment preview`;
    const { shopifyTheme } = await createOrFindThemeWithName(shopifyThemeName, SHOPIFY_AUTH);
    shopifyThemeId = shopifyTheme.id;
  }

  if (DEPLOYMENT_ACTIONS.has(ACTION)) {
    if (!shopifyThemeId && SHOPIFY_THEME_ID) shopifyThemeId = SHOPIFY_THEME_ID;
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
    const uniqueHiddenCommentString = "Comment created by GitHub Action `Shopify Theme Actions`";
    await createReplaceComment(message, uniqueHiddenCommentString, GITHUB_AUTH);

    return;
  }
}

run().catch((err) => handleError(err));
