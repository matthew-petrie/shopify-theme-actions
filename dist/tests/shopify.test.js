"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shopify_1 = require("../src/shopify");
const axios_1 = __importDefault(require("axios"));
const del_1 = __importDefault(require("del"));
if (!process.env.SHOPIFY_STORE_URL)
    throw new Error("Environment variable 'SHOPIFY_STORE_URL' is not set.");
if (!process.env.SHOPIFY_API_KEY)
    throw new Error("Environment variable 'SHOPIFY_STORE_URL' is not set.");
if (!process.env.SHOPIFY_PASSWORD)
    throw new Error("Environment variable 'SHOPIFY_STORE_URL' is not set.");
const SHOPIFY_AUTH = {
    storeUrl: process.env.SHOPIFY_STORE_URL,
    apiKey: process.env.SHOPIFY_API_KEY,
    password: process.env.SHOPIFY_PASSWORD,
};
let testingTheme;
beforeAll(async () => {
    const testingThemeName = `Shopify Theme Actions Test Theme ${new Date().getTime()}`;
    await shopify_1.createTheme(testingThemeName, SHOPIFY_AUTH);
    testingTheme = await shopify_1.getThemeByName(testingThemeName, SHOPIFY_AUTH);
    if (!testingTheme)
        throw new Error(`'testingTheme' failed to be created.`);
});
let themeIdsToRemove = [];
let themeNamesToRemove = [];
afterEach(async () => {
    // remove dynamically created themes...
    // ... by name
    for (let i = 0; i < themeNamesToRemove.length; i++) {
        const theme = await shopify_1.getThemeByName(themeNamesToRemove[i], SHOPIFY_AUTH);
        if (theme)
            themeIdsToRemove.push(theme.id);
    }
    themeNamesToRemove = [];
    // ... by id
    for (let i = 0; i < themeIdsToRemove.length; i++) {
        await axios_1.default.delete(`https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${themeIdsToRemove[i]}.json`);
    }
    themeIdsToRemove = [];
});
afterAll(async () => {
    // remove main testing theme
    if (testingTheme) {
        await axios_1.default.delete(`https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${testingTheme.id}.json`);
    }
    // remove any Shopify theme files/folders that were downloaded
    await del_1.default(["assets", "config", "layout", "locales", "templates", "config.yml"]);
});
describe(`Create Shopify theme`, () => {
    test(`Successful`, async () => {
        const themeName = `theme PR${new Date().getTime()}`;
        themeNamesToRemove.push(themeName);
        expect(await shopify_1.createTheme(themeName, SHOPIFY_AUTH)).toEqual(undefined);
    });
});
describe(`Get All Shopify Themes`, () => {
    test(`Successful`, async () => {
        expect(await shopify_1.getAllThemes(SHOPIFY_AUTH)).toEqual(expect.arrayContaining([testingTheme]));
    });
});
describe(`Get Shopify Theme by Name`, () => {
    test(`Theme exists`, async () => {
        expect(await shopify_1.getThemeByName(testingTheme.name, SHOPIFY_AUTH)).toEqual(testingTheme);
    });
    test(`Theme does not exist`, async () => {
        const themeName = `does not exist`;
        expect(await shopify_1.getThemeByName(themeName, SHOPIFY_AUTH)).toEqual(undefined);
    });
});
describe(`Deploy Shopify theme`, () => {
    test(`Successful`, async () => {
        expect(await shopify_1.deployTheme(testingTheme.id, SHOPIFY_AUTH)).toEqual(undefined);
    });
});
describe(`Create Or Find Theme With Name`, () => {
    test(`Theme with name already exists`, async () => {
        expect(await shopify_1.createOrFindThemeWithName(testingTheme.name, SHOPIFY_AUTH)).toEqual({
            prexisting: true,
            shopifyTheme: expect.objectContaining({
                id: testingTheme.id,
                name: testingTheme.name,
            }),
        });
    });
    test(`Theme with name does not exist`, async () => {
        const themeName = `New Theme ${new Date().getTime()}`;
        themeNamesToRemove.push(themeName);
        expect(await shopify_1.createOrFindThemeWithName(themeName, SHOPIFY_AUTH)).toEqual({
            prexisting: false,
            shopifyTheme: expect.objectContaining({ name: themeName }),
        });
    });
});
describe(`Generate Theme Preview URL`, () => {
    test(`Successful`, () => {
        expect(shopify_1.generateThemePreviewUrl(testingTheme.id, SHOPIFY_AUTH)).toEqual(`https://${SHOPIFY_AUTH.storeUrl}/?preview_theme_id=${testingTheme.id}`);
    });
});
