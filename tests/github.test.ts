import { inputStringToFlagsObject } from "../src/github";

describe(`inputStringToFlagsObject`, () => {
  test(`Two flags`, () => {
    const flagsString = "test=213,team=two";
    expect(inputStringToFlagsObject(flagsString)).toEqual({
      test: "213",
      team: "two",
    });
  });

  test(`Empty string of Flags`, () => {
    const flagsString = "";
    expect(inputStringToFlagsObject(flagsString)).toEqual(undefined);
  });

  test(`Flags is undefined`, () => {
    const flagsString = undefined;
    expect(inputStringToFlagsObject(flagsString)).toEqual(undefined);
  });
});
