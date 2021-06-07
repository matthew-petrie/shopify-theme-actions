"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThemePreviewUrl = exports.createOrFindThemeWithName = exports.deployTheme = exports.getThemeByName = exports.getAllThemes = exports.createTheme = void 0;
const themekit_1 = __importDefault(require("@shopify/themekit"));
const axios_1 = __importDefault(require("axios"));
const createTheme = async (themeName, SHOPIFY_AUTH) => {
    await themekit_1.default.command("new", {
        password: SHOPIFY_AUTH.password,
        store: SHOPIFY_AUTH.storeUrl,
        name: themeName,
    });
};
exports.createTheme = createTheme;
/** Returns all Shopify themes for a store in a JSON format (does not use the "\@shopify/themekit" module as this does not return JSON) */
const getAllThemes = async (SHOPIFY_AUTH) => {
    const { data: { themes }, } = await axios_1.default.get(`https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes.json`);
    return themes;
};
exports.getAllThemes = getAllThemes;
const getThemeByName = async (themeName, SHOPIFY_AUTH) => {
    // No way to retrieve a theme by name, so retrieve all themes and find the matching theme
    const themes = await exports.getAllThemes(SHOPIFY_AUTH);
    return themes.find((theme) => theme.name === themeName);
};
exports.getThemeByName = getThemeByName;
const deployTheme = async (shopifyThemeId, SHOPIFY_AUTH) => {
    await themekit_1.default.command("deploy", {
        password: SHOPIFY_AUTH.password,
        store: SHOPIFY_AUTH.storeUrl,
        themeId: shopifyThemeId,
    });
};
exports.deployTheme = deployTheme;
const createOrFindThemeWithName = async (shopifyThemeName, SHOPIFY_AUTH) => {
    // Theme may already exist - update the pre-existing if this is the case
    let shopifyTheme = await exports.getThemeByName(shopifyThemeName, SHOPIFY_AUTH);
    const prexisting = shopifyTheme ? true : false;
    // Theme does not exist in Shopify, create it
    if (!shopifyTheme) {
        await exports.createTheme(shopifyThemeName, SHOPIFY_AUTH);
        shopifyTheme = await exports.getThemeByName(shopifyThemeName, SHOPIFY_AUTH);
        if (!shopifyTheme) {
            throw new Error(`Shopify theme with name '${shopifyThemeName}' should have been created and the theme found in Shopify however the theme cannot be found in Shopify.`);
        }
    }
    return {
        prexisting,
        shopifyTheme: shopifyTheme,
    };
};
exports.createOrFindThemeWithName = createOrFindThemeWithName;
const generateThemePreviewUrl = (shopifyThemeId, SHOPIFY_AUTH) => `https://${SHOPIFY_AUTH.storeUrl}/?preview_theme_id=${shopifyThemeId}`;
exports.generateThemePreviewUrl = generateThemePreviewUrl;
