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
import { sleepMs } from "./helper";

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

let testingTheme: shopifyTheme | undefined,
  liveTestingTheme: shopifyTheme | undefined,
  originallyLiveTheme: shopifyTheme | undefined;
beforeAll(async () => {
  const allOriginalShopifyThemes = await getAllThemes(SHOPIFY_AUTH);
  originallyLiveTheme = allOriginalShopifyThemes.find(
    (shopifyTheme) => shopifyTheme.role === `main` // 'main' means 'live'
  );
  if (!originallyLiveTheme)
    throw new Error(`Could not find the theme that was 'live' prior to the tests starting.`);

  const testingThemeName = `Shopify Theme Actions Test Theme ${new Date().getTime()}`;
  await createTheme(testingThemeName, SHOPIFY_AUTH);
  testingTheme = await getThemeByName(testingThemeName, SHOPIFY_AUTH);
  if (!testingTheme) throw new Error(`'testingTheme' failed to be created.`);

  const liveTestingThemeName = `Shopify Theme Actions Test Theme 2 ${new Date().getTime()}`;
  await createTheme(liveTestingThemeName, SHOPIFY_AUTH);
  liveTestingTheme = await getThemeByName(liveTestingThemeName, SHOPIFY_AUTH);
  if (!liveTestingTheme) throw new Error(`'liveTestingTheme' failed to be created.`);
  // make theme the live theme
  await http.put(
    `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${liveTestingTheme.id}.json`,
    { theme: { id: liveTestingTheme.id, role: "main" } }
  );
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

  // add delay after each test to avoid "429 Too Many Requests" being returned from Shopify
  await sleepMs(1000);
}, 10000);

afterAll(async () => {
  // make the originally live theme 'live' again
  if (originallyLiveTheme) {
    await http.put(
      `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${originallyLiveTheme.id}.json`,
      { theme: { id: originallyLiveTheme.id, role: "main" } }
    );
  }

  // remove main testing themes
  if (testingTheme) {
    await http.delete(
      `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${testingTheme.id}.json`
    );
  }
  if (liveTestingTheme) {
    await http.delete(
      `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${liveTestingTheme.id}.json`
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
  test(`No flags`, async () => {
    expect(await deployTheme((testingTheme as shopifyTheme).id, SHOPIFY_AUTH)).toEqual(undefined);
  });

  test(`Has flags, cannot deploy to live theme as 'allowLive' flag is false`, async () => {
    const SHOPIFY_THEME_KIT_FLAGS = {
      allowLive: false,
      dir: "./",
    };

    let error: Error | undefined;
    try {
      await deployTheme(
        (liveTestingTheme as shopifyTheme).id,
        SHOPIFY_AUTH,
        SHOPIFY_THEME_KIT_FLAGS
      );
    } catch (err) {
      error = err as Error;
    }
    expect(error).toEqual(
      expect.stringContaining(`cannot make changes to a live theme without an override`)
    );
  });

  test(`Has flags, deploy to live theme, 'allowLive' flag is true`, async () => {
    const SHOPIFY_THEME_KIT_FLAGS = {
      allowLive: true,
      dir: "./",
    };
    expect(
      await deployTheme(
        (liveTestingTheme as shopifyTheme).id,
        SHOPIFY_AUTH,
        SHOPIFY_THEME_KIT_FLAGS
      )
    ).toEqual(undefined);
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

    await sleepMs(1000);
    const theme = await getThemeByName(themeName, SHOPIFY_AUTH);
    if (!theme) throw new Error("test setup failed to create theme");

    await sleepMs(1000);
    expect(await removeTheme(theme.id, SHOPIFY_AUTH)).toEqual(undefined);

    // check theme has been removed
    await sleepMs(1000);
    expect(await getThemeByName(themeName, SHOPIFY_AUTH)).toEqual(undefined);
  }, 10000);
});
