/* eslint-disable @typescript-eslint/naming-convention */
import process from "node:process";
import anyTest, { type TestFn } from "ava";
import { applyEnvironmentVariables } from "../../src/helpers/apply-environment-variables.js";

const test = anyTest as TestFn<{
	originalProcessEnv: typeof process["env"];
}>;

test.beforeEach("reset process.env", t => {
	t.context.originalProcessEnv = process.env;
	process.env = {};
});

test.after("reapply process.env", t => {
	process.env = t.context.originalProcessEnv;
});

type MacroArgs = {
	env_Vars: string[];
	expected: string[] | Record<string, string>;
};

const verifyEnv = test.macro((t, { env_Vars: input, expected }: MacroArgs) => {
	applyEnvironmentVariables(input);

	if (Array.isArray(expected)) {
		t.deepEqual(Object.keys(process.env), expected);
	} else {
		t.deepEqual(process.env, expected);
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
