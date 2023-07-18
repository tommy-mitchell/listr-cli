// From https://github.com/total-typescript/ts-reset/pull/110

type Split<Splitter extends string, Limit extends number> = (
	Limit extends 0
		? [] // eslint-disable-line @typescript-eslint/ban-types
		: Splitter extends ""
			? string[]
			: [string, ...string[]]
);

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface String {
	split<Splitter extends string, Limit extends number>(
		splitter: { [Symbol.split](string: Splitter, limit?: number): Split<Splitter, Limit> },
		limit?: Limit
	): Split<Splitter, Limit>;
	split<Seperator extends string, Limit extends number>(
		seperator: Seperator,
		limit?: Limit
	): Split<Seperator, Limit>;
}

