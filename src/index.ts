import { getActionInputs, handleError } from "./github";
import { deployment, deploymentPreview, removeDeploymentPreviewTheme } from "./index.help";

async function run(): Promise<void> {
  const { SHOPIFY_AUTH, GITHUB_AUTH, SHOPIFY_THEME_ID, ACTION, SHOPIFY_THEME_KIT_FLAGS } =
    getActionInputs();

  if (ACTION === "REMOVE_DEPLOYMENT_PREVIEW_THEME")
    await removeDeploymentPreviewTheme(GITHUB_AUTH, SHOPIFY_AUTH);
  else if (ACTION === "DEPLOYMENT_PREVIEW")
    await deploymentPreview(ACTION, SHOPIFY_AUTH, GITHUB_AUTH, SHOPIFY_THEME_KIT_FLAGS);
  else if (ACTION === "DEPLOY") {
    await deployment(SHOPIFY_AUTH, GITHUB_AUTH, SHOPIFY_THEME_KIT_FLAGS, SHOPIFY_THEME_ID);
  }
}

run().catch((err) => handleError(err));
