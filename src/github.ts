import * as github from "@actions/github";
import { shopifyAuth } from "./shopify";
import * as core from "@actions/core";

type action = "DEPLOYMENT_PREVIEW" | "DEPLOY";
const VALID_ACTIONS: Set<action> = new Set(["DEPLOYMENT_PREVIEW", "DEPLOY"]);

interface flagsObject {
  [key: string]: string;
}

export const getPullRequestId = (): number => github.context.issue.number;

/**
 * Convert a string with the format `FLAG=VALUE,FLAG=VALUE` to an obejct with the format:
 * ```
 * { FLAG: VALUE, FLAG: VALUE }
 * ```
 */
export const inputStringToFlagsObject = (
  flagsString: string | undefined
): flagsObject | undefined => {
  if (!flagsString || flagsString === "") return undefined;

  const flagsArray = flagsString.split(",");
  return flagsArray.reduce((acc: flagsObject, flag): flagsObject => {
    const [key, value] = flag.split("=");
    acc[key] = value;
    return acc;
  }, {});
};

/** Retrieve and validate Github Action inputs */
export const getActionInputs = (): {
  SHOPIFY_AUTH: shopifyAuth;
  ACTION: action;
  SHOPIFY_THEME_ID?: number;
  SHOPIFY_THEME_KIT_FLAGS?: flagsObject;
} => {
  const ACTION = core.getInput("ACTION", { required: true });
  if (!VALID_ACTIONS.has(ACTION as action)) throw new Error();

  const SHOPIFY_AUTH: shopifyAuth = <const>{
    storeUrl: core.getInput("SHOPIFY_STORE_URL", { required: true }),
    apiKey: core.getInput("SHOPIFY_API_KEY", { required: true }),
    password: core.getInput("SHOPIFY_PASSWORD", { required: true }),
  };

  const shopifyThemeIdString = core.getInput("SHOPIFY_THEME_ID", { required: false });
  const SHOPIFY_THEME_ID: number | undefined =
    (shopifyThemeIdString && shopifyThemeIdString.length > 0 && parseInt(shopifyThemeIdString)) ||
    undefined;

  const themeKitFlagsString = core.getInput("SHOPIFY_THEME_KIT_FLAGS", { required: false });
  const SHOPIFY_THEME_KIT_FLAGS = inputStringToFlagsObject(themeKitFlagsString);

  return {
    SHOPIFY_AUTH,
    SHOPIFY_THEME_ID,
    ACTION: ACTION as action,
    SHOPIFY_THEME_KIT_FLAGS,
  };
};

/** Output variables can be accessed by any following GitHub Actions which can be useful for things like visual regression, performance, etc. testing */
export const outputVariables = (variables: { [key: string]: string }): void => {
  for (const key in variables) core.setOutput(key, variables[key]);
};

export const handleError = (err: Error): void => {
  if (err instanceof Error) core.setFailed(err.message);
  else core.setFailed(err);
};
