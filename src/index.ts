import { getActionInputs, getPullRequestId, handleError, outputVariables } from "./github";
import { createOrFindThemeWithName, generateThemePreviewUrl, deployTheme } from "./shopify";

const DEPLOYMENT_ACTIONS = new Set([`DEPLOY`, `DEPLOYMENT_PREVIEW`]);

async function run(): Promise<void> {
  const { SHOPIFY_AUTH, SHOPIFY_THEME_ID, ACTION } = getActionInputs();

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
    await deployTheme(shopifyThemeId, SHOPIFY_AUTH);

    const themePreviewUrl = generateThemePreviewUrl(shopifyThemeId, SHOPIFY_AUTH);

    outputVariables({
      SHOPIFY_THEME_ID: shopifyThemeId.toString(),
      SHOPIFY_THEME_PREVIEW_URL: themePreviewUrl,
    });

    return;
  }
}

run().catch((err) => handleError(err));
