declare module "@shopify/themekit" {
  /** Theme Kit command to run. */
  export declare type command = "deploy" | "new" | "remove";

  /**
   * Flags to pass into the command.
   *
   * All flags specified in the Theme Kit documentation are available, but in camelCase rather than in --flagform.
   */
  export interface commandFlags {
    password: string;
    store: string;
    name?: string;
    themeId?: number;
  }

  /** Node Theme Kit module specific options */
  export interface commandOptions {
    /** Hard-code a working directory to run the binary from */
    cwd?: string;
    /** Set level additional output info | 'silent', 'error', 'all', 'silly' */
    logLevel?: string;
  }

  /**
   * This wrapper exposes a single function in its API which allows it to run any command available in the [original Theme Kit CLI](https://shopify.dev/tools/theme-kit/command-reference).
   * View a [complete list of commands and args](shopify.github.io/themekit/commands).
   *
   * NOTE: some commands / options may need type definitions to be created
   */
  export declare function command(
    command: command,
    flags?: commandFlags,
    options?: commandOptions
  ): Promise<void>;
}
