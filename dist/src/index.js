"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("./github");
const shopify_1 = require("./shopify");
const DEPLOYMENT_ACTIONS = new Set([`DEPLOY`, `DEPLOYMENT_PREVIEW`]);
async function run() {
    const { SHOPIFY_AUTH, SHOPIFY_THEME_ID, ACTION } = github_1.getActionInputs();
    let shopifyThemeId;
    if (ACTION === "DEPLOYMENT_PREVIEW") {
        const pullRequestNumber = github_1.getPullRequestId();
        const shopifyThemeName = `PR ${pullRequestNumber} - deployment preview`;
        const { shopifyTheme } = await shopify_1.createOrFindThemeWithName(shopifyThemeName, SHOPIFY_AUTH);
        shopifyThemeId = shopifyTheme.id;
    }
    if (DEPLOYMENT_ACTIONS.has(ACTION)) {
        if (!shopifyThemeId && SHOPIFY_THEME_ID)
            shopifyThemeId = SHOPIFY_THEME_ID;
        if (!shopifyThemeId) {
            throw new Error(`'shopifyThemeId' is not set but is required in order to deploy the theme to Shopify (if using the 'DEPLOY' action make sure to set 'SHOPIFY_THEME_ID').`);
        }
        await shopify_1.deployTheme(shopifyThemeId, SHOPIFY_AUTH);
        const themePreviewUrl = shopify_1.generateThemePreviewUrl(shopifyThemeId, SHOPIFY_AUTH);
        github_1.outputVariables({
            SHOPIFY_THEME_ID: shopifyThemeId.toString(),
            SHOPIFY_THEME_PREVIEW_URL: themePreviewUrl,
        });
        return;
    }
}
run().catch((err) => github_1.handleError(err));
