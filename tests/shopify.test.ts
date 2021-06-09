import {
  createTheme,
  getThemeByName,
  getAllThemes,
  shopifyAuth,
  deployTheme,
  shopifyTheme,
  createOrFindThemeWithName,
  generateThemePreviewUrl,
  removeTheme,
} from "../src/shopify";
import del from "del";
import axios from "axios";
import rateLimit from "axios-rate-limit";

const http = rateLimit(axios.create(), { maxRPS: 2 });

if (!process.env.SHOPIFY_STORE_URL)
  throw new Error("Environment variable 'SHOPIFY_STORE_URL' is not set.");
if (!process.env.SHOPIFY_API_KEY)
  throw new Error("Environment variable 'SHOPIFY_STORE_URL' is not set.");
if (!process.env.SHOPIFY_PASSWORD)
  throw new Error("Environment variable 'SHOPIFY_STORE_URL' is not set.");

const SHOPIFY_AUTH: shopifyAuth = {
  storeUrl: process.env.SHOPIFY_STORE_URL,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_PASSWORD,
};

let testingTheme: shopifyTheme | undefined;
beforeAll(async () => {
  const testingThemeName = `Shopify Theme Actions Test Theme ${new Date().getTime()}`;
  await createTheme(testingThemeName, SHOPIFY_AUTH);
  testingTheme = await getThemeByName(testingThemeName, SHOPIFY_AUTH);

  if (!testingTheme) throw new Error(`'testingTheme' failed to be created.`);
});

let themeIdsToRemove: number[] = [];
let themeNamesToRemove: string[] = [];
afterEach(async () => {
  // remove dynamically created themes...

  // ... by name
  for (let i = 0; i < themeNamesToRemove.length; i++) {
    const theme = await getThemeByName(themeNamesToRemove[i], SHOPIFY_AUTH);
    if (theme) themeIdsToRemove.push(theme.id);
  }
  themeNamesToRemove = [];

  // ... by id
  for (let i = 0; i < themeIdsToRemove.length; i++) {
    await http.delete(
      `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${themeIdsToRemove[i]}.json`
    );
  }
  themeIdsToRemove = [];
});
afterAll(async () => {
  // remove main testing theme
  if (testingTheme) {
    await http.delete(
      `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${testingTheme.id}.json`
    );
  }

  // remove any Shopify theme files/folders that were downloaded
  await del(["assets", "config", "layout", "locales", "templates", "config.yml"]);
});

describe(`Create Shopify theme`, () => {
  test(`Successful`, async () => {
    const themeName = `theme PR${new Date().getTime()}`;
    themeNamesToRemove.push(themeName);
    expect(await createTheme(themeName, SHOPIFY_AUTH)).toEqual(undefined);
  });
});

describe(`Get All Shopify Themes`, () => {
  test(`Successful`, async () => {
    expect(await getAllThemes(SHOPIFY_AUTH)).toEqual(expect.arrayContaining([testingTheme]));
  });
});

describe(`Get Shopify Theme by Name`, () => {
  test(`Theme exists`, async () => {
    expect(await getThemeByName((testingTheme as shopifyTheme).name, SHOPIFY_AUTH)).toEqual(
      testingTheme
    );
  });

  test(`Theme does not exist`, async () => {
    const themeName = `does not exist`;
    expect(await getThemeByName(themeName, SHOPIFY_AUTH)).toEqual(undefined);
  });
});

describe(`Deploy Shopify theme`, () => {
  test(`Successful`, async () => {
    expect(await deployTheme((testingTheme as shopifyTheme).id, SHOPIFY_AUTH)).toEqual(undefined);
  });
});

describe(`Create Or Find Theme With Name`, () => {
  test(`Theme with name already exists`, async () => {
    expect(
      await createOrFindThemeWithName((testingTheme as shopifyTheme).name, SHOPIFY_AUTH)
    ).toEqual({
      prexisting: true,
      shopifyTheme: expect.objectContaining({
        id: (testingTheme as shopifyTheme).id,
        name: (testingTheme as shopifyTheme).name,
      }) as shopifyTheme,
    });
  });

  test(`Theme with name does not exist`, async () => {
    const themeName = `New Theme ${new Date().getTime()}`;
    themeNamesToRemove.push(themeName);
    expect(await createOrFindThemeWithName(themeName, SHOPIFY_AUTH)).toEqual({
      prexisting: false,
      shopifyTheme: expect.objectContaining({ name: themeName }) as shopifyTheme,
    });
  });
});

describe(`Generate Theme Preview URL`, () => {
  test(`Successful`, () => {
    expect(generateThemePreviewUrl((testingTheme as shopifyTheme).id, SHOPIFY_AUTH)).toEqual(
      `https://${SHOPIFY_AUTH.storeUrl}/?preview_theme_id=${(testingTheme as shopifyTheme).id}`
    );
  });
});

describe(`Remove Theme`, () => {
  test(`Success`, async () => {
    const themeName = `Shopify Theme Actions Test Theme 2 ${new Date().getTime()}`;
    await createTheme(themeName, SHOPIFY_AUTH);
    const theme = await getThemeByName(themeName, SHOPIFY_AUTH);
    if (!theme) throw new Error("test setup failed to create theme");

    expect(await removeTheme(theme.id, SHOPIFY_AUTH)).toEqual(undefined);

    // check theme has been removed
    expect(await getThemeByName(themeName, SHOPIFY_AUTH)).toEqual(undefined);
  });
});
