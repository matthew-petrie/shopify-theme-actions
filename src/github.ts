import * as github from "@actions/github";
import { shopifyAuth } from "./shopify";
import * as core from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types";

export type action = "DEPLOYMENT_PREVIEW" | "DEPLOY" | "REMOVE_DEPLOYMENT_PREVIEW_THEME";
export const VALID_ACTIONS: Set<action> = new Set([
  "DEPLOYMENT_PREVIEW",
  "DEPLOY",
  "REMOVE_DEPLOYMENT_PREVIEW_THEME",
]);

export interface shopifyThemeKitFlags {
  dir: string;
  allowLive: boolean;
}
export interface githubAuth {
  token?: string;
}
type githubComment = RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"][0];

export const getPullRequestId = (): number => github.context.issue.number;

/** Retrieve and validate Github Action inputs */
export const getActionInputs = (): {
  SHOPIFY_AUTH: shopifyAuth;
  GITHUB_AUTH: githubAuth;
  ACTION: action;
  SHOPIFY_THEME_ID?: number;
  SHOPIFY_THEME_KIT_FLAGS: shopifyThemeKitFlags;
} => {
  const ACTION = core.getInput("ACTION", { required: true });
  if (!VALID_ACTIONS.has(ACTION as action)) throw new Error();

  const githubToken = core.getInput("GITHUB_TOKEN", { required: false });
  const GITHUB_AUTH: githubAuth = <const>{
    token: (githubToken.length > 0 && githubToken) || undefined,
  };

  const SHOPIFY_AUTH: shopifyAuth = <const>{
    storeUrl: core.getInput("SHOPIFY_STORE_URL", { required: true }),
    apiKey: core.getInput("SHOPIFY_API_KEY", { required: true }),
    password: core.getInput("SHOPIFY_PASSWORD", { required: true }),
  };

  const shopifyThemeIdString = core.getInput("SHOPIFY_THEME_ID", { required: false });
  const SHOPIFY_THEME_ID: number | undefined =
    (shopifyThemeIdString && shopifyThemeIdString.length > 0 && parseInt(shopifyThemeIdString)) ||
    undefined;

  const SHOPIFY_THEME_KIT_FLAGS: shopifyThemeKitFlags = {
    dir: core.getInput("SHOPIFY_THEME_DIRECTORY", { required: true }),
    allowLive: core.getBooleanInput("SHOPIFY_ALLOW_LIVE_THEME_DEPLOYMENT", { required: false }),
  };

  // validate theme kit flags
  if (!SHOPIFY_THEME_KIT_FLAGS.dir || SHOPIFY_THEME_KIT_FLAGS.dir.length > 0)
    throw new Error("'SHOPIFY_THEME_DIRECTORY' must be set.");

  return {
    SHOPIFY_AUTH,
    GITHUB_AUTH,
    SHOPIFY_THEME_ID,
    ACTION: ACTION as action,
    SHOPIFY_THEME_KIT_FLAGS,
  };
};

/** Output variables can be accessed by any following GitHub Actions which can be useful for things like visual regression, performance, etc. testing */
export const outputVariables = (variables: { [key: string]: string }): void => {
  for (const key in variables) core.setOutput(key, variables[key]);
};

export const findIssueComment = async (
  uniqueCommentString: string,
  githubContext: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<githubComment | undefined> => {
  if (!githubContext.payload.pull_request) {
    // Could be running outside of a PR, if so do not add a comment
    core.info(`GitHub Action is not running from within a PR.`);
    return;
  }

  const { data: comments } = await octokit.rest.issues.listComments({
    ...githubContext.repo,
    issue_number: githubContext.payload.pull_request.number,
  });
  return comments.find((comment) => comment.body && comment.body.includes(uniqueCommentString));
};

const deleteIssueComment = async (
  comment: githubComment | undefined,
  githubContext: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<void> => {
  if (!comment) return;

  await octokit.rest.issues.deleteComment({
    ...githubContext.repo,
    comment_id: comment.id,
  });
};

const createIssueComment = async (
  message: string,
  githubContext: Context,
  octokit: InstanceType<typeof GitHub>
): Promise<void> => {
  if (!githubContext.payload.pull_request) {
    // Could be running outside of a PR, if so do not add a comment
    core.info(`GitHub Action is not running from within a PR.`);
    return;
  }

  await octokit.rest.issues.createComment({
    ...githubContext.repo,
    issue_number: githubContext.payload.pull_request.number,
    body: message,
  });
};

/** Find pre-exiting comment (if there is one) with the `uniqueCommentString` and delete it. Then create a new comment using the `uniqueCommentString` */
export const createReplaceComment = async (
  message: string,
  uniqueHiddenCommentString: string,
  shopifyThemeId: number,
  GITHUB_AUTH: githubAuth
): Promise<void> => {
  if (!GITHUB_AUTH.token) {
    // comments are optional
    core.info(`GitHub Action will not leave a comment as the 'GITHUB_TOKEN' has not be provied.`);
    return;
  }

  const githubContext = github.context;
  if (!githubContext.payload.pull_request) {
    // Could be running outside of a PR, if so do not add a comment
    core.info(`GitHub Action is not running from within a PR.`);
    return;
  }

  const octokit = github.getOctokit(GITHUB_AUTH.token);

  const oldComment = await findIssueComment(uniqueHiddenCommentString, githubContext, octokit);
  await deleteIssueComment(oldComment, githubContext, octokit);

  const combinedMessage = `<!-- ${uniqueHiddenCommentString} --><!-- Shopify Theme ID ${shopifyThemeId} -->${message}`;
  await createIssueComment(combinedMessage, githubContext, octokit);
};

/**
 * The Shopify theme id is hidden within a Github PR comment in the format `<!-- Shopify Theme ID THEME_ID -->`.
 * Extract the theme id and return it as an integer.
 * */
export const retrieveShopifyThemeIdFromIssueComment = (commentBody: string): number | undefined => {
  const regexMatch = /<!-- Shopify Theme ID ([0-9]+) -->/.exec(commentBody);
  if (!regexMatch) {
    core.error(`Cannot find Shopify Theme ID in the last deployment preview comment.`);
    return;
  }

  const shopifyThemeId = parseInt(regexMatch[1]);
  return shopifyThemeId;
};

export const handleError = (err: Error): void => {
  core.setFailed(err || "Unknown Error");
};
