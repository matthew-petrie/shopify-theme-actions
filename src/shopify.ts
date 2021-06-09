import themeKit from "@shopify/themekit";
import axios from "axios";

/** Max 150 characters */
type themeName = string;

export interface shopifyAuth {
  storeUrl: string;
  apiKey: string;
  password: string;
}

type shopifyThemeRole = "main" | "unpublished" | "demo";
export interface shopifyTheme {
  id: number;
  theme_store_id: number | null;
  name: themeName;
  role: shopifyThemeRole;
  previewable: boolean;
  processing: boolean;
  updated_at: string;
  created_at: string;
}
interface axiosShopifyThemesRes {
  themes: shopifyTheme[];
}

export const createTheme = async (
  themeName: themeName,
  SHOPIFY_AUTH: shopifyAuth
): Promise<void> => {
  await themeKit.command("new", {
    password: SHOPIFY_AUTH.password,
    store: SHOPIFY_AUTH.storeUrl,
    name: themeName,
  });
};

/** Returns all Shopify themes for a store in a JSON format (does not use the "\@shopify/themekit" module as this does not return JSON) */
export const getAllThemes = async (SHOPIFY_AUTH: shopifyAuth): Promise<shopifyTheme[]> => {
  const {
    data: { themes },
  } = await axios.get<axiosShopifyThemesRes>(
    `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes.json`
  );

  return themes;
};

export const getThemeByName = async (
  themeName: themeName,
  SHOPIFY_AUTH: shopifyAuth
): Promise<shopifyTheme | undefined> => {
  // No way to retrieve a theme by name, so retrieve all themes and find the matching theme
  const themes = await getAllThemes(SHOPIFY_AUTH);
  return themes.find((theme) => theme.name === themeName);
};

export const deployTheme = async (
  shopifyThemeId: number,
  SHOPIFY_AUTH: shopifyAuth,
  SHOPIFY_THEME_KIT_FLAGS?: { [key: string]: string }
): Promise<void> => {
  await themeKit.command("deploy", {
    ...(SHOPIFY_THEME_KIT_FLAGS || {}),
    password: SHOPIFY_AUTH.password,
    store: SHOPIFY_AUTH.storeUrl,
    themeId: shopifyThemeId,
  });
};

export const createOrFindThemeWithName = async (
  shopifyThemeName: themeName,
  SHOPIFY_AUTH: shopifyAuth
): Promise<{
  /** Theme already existed? */
  prexisting: boolean;
  /** Full details about the matching / created theme */
  shopifyTheme: shopifyTheme;
}> => {
  // Theme may already exist - update the pre-existing if this is the case
  let shopifyTheme = await getThemeByName(shopifyThemeName, SHOPIFY_AUTH);
  const prexisting = shopifyTheme ? true : false;

  // Theme does not exist in Shopify, create it
  if (!shopifyTheme) {
    await createTheme(shopifyThemeName, SHOPIFY_AUTH);
    shopifyTheme = await getThemeByName(shopifyThemeName, SHOPIFY_AUTH);
    if (!shopifyTheme) {
      throw new Error(
        `Shopify theme with name '${shopifyThemeName}' should have been created and the theme found in Shopify however the theme cannot be found in Shopify.`
      );
    }
  }

  return {
    prexisting,
    shopifyTheme: shopifyTheme,
  };
};

export const generateThemePreviewUrl = (
  shopifyThemeId: number,
  SHOPIFY_AUTH: shopifyAuth
): string => `https://${SHOPIFY_AUTH.storeUrl}/?preview_theme_id=${shopifyThemeId}`;

export const removeTheme = async (themeId: number, SHOPIFY_AUTH: shopifyAuth): Promise<void> => {
  await axios.delete(
    `https://${SHOPIFY_AUTH.apiKey}:${SHOPIFY_AUTH.password}@${SHOPIFY_AUTH.storeUrl}/admin/api/2021-04/themes/${themeId}.json`
  );
};
