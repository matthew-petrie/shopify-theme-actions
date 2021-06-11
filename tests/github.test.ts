import { retrieveShopifyThemeIdFromIssueComment } from "../src/github";

describe(`Retrieve Shopify Theme Id From Issue Comment`, () => {
  test(`Theme ID is in comment`, () => {
    const commentBody = `<!-- A different comment --><!-- Shopify Theme ID 123456789 -->Some random unrelated string`;
    expect(retrieveShopifyThemeIdFromIssueComment(commentBody)).toEqual(123456789);
  });

  test(`Theme ID is not in comment`, () => {
    const commentBody = `A random string with no id`;
    expect(retrieveShopifyThemeIdFromIssueComment(commentBody)).toEqual(undefined);
  });
});
