"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.outputVariables = exports.getActionInputs = exports.getPullRequestId = void 0;
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const VALID_ACTIONS = new Set(["DEPLOYMENT_PREVIEW", "DEPLOY"]);
const getPullRequestId = () => github.context.issue.number;
exports.getPullRequestId = getPullRequestId;
/** Retrieve and validate Github Action inputs */
const getActionInputs = () => {
    const ACTION = core.getInput("ACTION", { required: true });
    if (!VALID_ACTIONS.has(ACTION))
        throw new Error();
    const SHOPIFY_AUTH = {
        storeUrl: core.getInput("SHOPIFY_STORE_URL", { required: true }),
        apiKey: core.getInput("SHOPIFY_API_KEY", { required: true }),
        password: core.getInput("SHOPIFY_PASSWORD", { required: true }),
    };
    const shopifyThemeIdString = core.getInput("SHOPIFY_THEME_ID", { required: false });
    const SHOPIFY_THEME_ID = (shopifyThemeIdString && shopifyThemeIdString.length > 0 && parseInt(shopifyThemeIdString)) ||
        undefined;
    return {
        SHOPIFY_AUTH,
        SHOPIFY_THEME_ID,
        ACTION: ACTION,
    };
};
exports.getActionInputs = getActionInputs;
/** Output variables can be accessed by any following GitHub Actions which can be useful for things like visual regression, performance, etc. testing */
const outputVariables = (variables) => {
    for (const key in variables)
        core.setOutput(key, variables[key]);
};
exports.outputVariables = outputVariables;
const handleError = (err) => {
    if (err instanceof Error)
        core.setFailed(err.message);
    else
        core.setFailed(err);
};
exports.handleError = handleError;
