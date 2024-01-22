/* eslint-disable @typescript-eslint/naming-convention */
import test from "ava";
import { parseEnvironmentVariables } from "../../src/helpers/parse-environment-variables.js";

type MacroArgs = {
	env_Vars: string[];
	expected: string[] | Record<string, string>;
};

const verifyEnv = test.macro((t, { env_Vars: input, expected }: MacroArgs) => {
	const env = parseEnvironmentVariables(input);

	if (Array.isArray(expected)) {
		t.deepEqual(Object.keys(env), expected);
	} else {
		t.deepEqual(env, expected);
	}
});

test.serial("separates by comma", verifyEnv, {
	env_Vars: ["A,B,C,D"],
	expected: ["A", "B", "C", "D"],
});

test.serial("processes an array of env vars", verifyEnv, {
	env_Vars: ["A", "B", "C", "D"],
	expected: ["A", "B", "C", "D"],
});

test.serial("sets env vars without a : to true", verifyEnv, {
	env_Vars: ["A", "B"],
	expected: { A: "true", B: "true" },
});

test.serial("splits and sets env vars with a : to the split value", verifyEnv, {
	env_Vars: ["A:foo", "B:bar"],
	expected: { A: "foo", B: "bar" },
});

test.serial("allows spaces in values", verifyEnv, {
	env_Vars: ["A:foo bar"],
	expected: { A: "foo bar" },
});

test.serial("later values override earlier ones", verifyEnv, {
	env_Vars: ["FOO:bar", "FOO:baz"],
	expected: { FOO: "baz" },
});

test.serial("allows commas in values if quoted: double quotes", verifyEnv, {
	env_Vars: ["LIST:\"foo,bar, baz\""],
	expected: { LIST: "foo,bar, baz" },
});

test.serial("allows commas in values if quoted: single quotes", verifyEnv, {
	env_Vars: ["LIST:'foo,bar, baz'"],
	expected: { LIST: "foo,bar, baz" },
});

test.serial("allows double or single quotes, separates by comma, sets to true or split value", verifyEnv, {
	env_Vars: ["FOO", "BAR,LIST:\"a,b,c\",FOO,BAR:'baz'", "FIZZ:buzz bazz"],
	expected: { FOO: "true", BAR: "baz", LIST: "a,b,c", FIZZ: "buzz bazz" },
});
