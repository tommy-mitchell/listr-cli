import type { MatchAll } from "./types.js";

/**
 * Matches environment variables, including in lists.
 *
 * @see https://regex101.com/r/PLDcEt/1
 *
 * @example
 * 1. /(?=[^,])/                   // Skip commas
 * 2. /(?<env>[^:,]*)/             // Capture environment variable name (anything before : or ,)
 * 3. /(?: ... | ... )?/           // Search for variable value, 0-1 times
 * 4. /:["'](?<quoted>[^"']*)["']/ // First alternate: capture quoted value (after :, between "" or '')
 * 5. /:(?<value>[^,]*)/           // Second alternate: capture unquoted value (after :, anything before ,)
 */
const environmentVariableRegex = /(?=[^,])(?<env>[^:,]*)(?::["'](?<quoted>[^"']*)["']|:(?<value>[^,]*))?/g;

/**
 * Parses environment variable input into separate values.
 *
 * Separates values by comma. Values are set to `"true"`. If a value has a `:`,
 * it will be split and set to the value following the `:`. Commas in values must be quoted.
 * Later values override earlier ones.
 *
 * @example
 * // listr -e FOO -e BAR,LIST:\"a,b,c\",FOO,BAR:\'baz\' -e FIZZ:'buzz bazz'
 * applyEnvironmentVariables(["FOO", "BAR,LIST:\"a,b,c\",FOO,BAR:'baz'", "FIZZ:buzz bazz"]);
 * //=> {
 * //=>   FOO: "true",
 * //=>   BAR: "baz",
 * //=>   LIST: "a,b,c",
 * //=>   FIZZ: "buzz bazz",
 * //=> }
 */
export const parseEnvironmentVariables = (environment: string[]): Record<string, string> => {
	const parsedEnvironmentVariables: Record<string, string> = {};

	for (const argument of environment) {
		const pairs = argument.matchAll(environmentVariableRegex) as MatchAll<"env", "quoted" | "value">;

		for (const pair of pairs) {
			const key = pair.groups.env;
			const value = pair.groups.quoted ?? pair.groups.value;

			parsedEnvironmentVariables[key] = value ?? String(true);
		}
	}

	return parsedEnvironmentVariables;
};
