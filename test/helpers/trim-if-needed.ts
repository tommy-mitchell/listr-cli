import test from "ava";
import { trimIfNeeded } from "../../src/helpers/trim-if-needed.js";

test("trims strings with a single non-empty line", t => {
	t.is(trimIfNeeded("foo\n"), "foo");
	t.is(trimIfNeeded("\nfoo"), "foo");
	t.is(trimIfNeeded("\nfoo\n"), "foo");
	t.is(trimIfNeeded("\nfoo\n\n\n\n\n"), "foo");
});

test("preserves strings with multiple lines", t => {
	t.is(trimIfNeeded("foo\nbar\n"), "foo\nbar\n");
});

test("has no effect on single-line strings", t => {
	t.is(trimIfNeeded("foo"), "foo");
});
