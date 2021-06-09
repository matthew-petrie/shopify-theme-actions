import github from "@actions/github";
import { shopifyAuth } from "./shopify";
import core from "@actions/core";
import { Context } from "@actions/github/lib/context";
import { GitHub } from "@actions/github/lib/utils";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types";

type action = "DEPLOYMENT_PREVIEW" | "DEPLOY";
const VALID_ACTIONS: Set<action> = new Set(["DEPLOYMENT_PREVIEW", "DEPLOY"]);

interface flagsObject {
  [key: string]: string;
}
interface githubAuth {
  token?: string;
}
type githubComment = RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"][0];

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
  GITHUB_AUTH: githubAuth;
  ACTION: action;
  SHOPIFY_THEME_ID?: number;
  SHOPIFY_THEME_KIT_FLAGS?: flagsObject;
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

  const themeKitFlagsString = core.getInput("SHOPIFY_THEME_KIT_FLAGS", { required: false });
  const SHOPIFY_THEME_KIT_FLAGS = inputStringToFlagsObject(themeKitFlagsString);

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

const findIssueComment = async (
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
  return comments.find((comment) => comment.body?.includes(uniqueCommentString));
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

  const combinedMessage = `<!-- ${uniqueHiddenCommentString} -->${message}`;
  await createIssueComment(combinedMessage, githubContext, octokit);
};

export const handleError = (err: Error): void => {
  if (err instanceof Error) core.setFailed(err.message);
  else core.setFailed(err);
};
