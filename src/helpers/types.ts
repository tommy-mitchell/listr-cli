// Based on https://github.com/microsoft/TypeScript/issues/32098#issuecomment-1279645368
type RegExpGroups<Groups extends string, Alternates extends string | undefined = undefined> = (
	RegExpMatchArray & {
		groups: (
			| { [name in Groups]: string }
			| { [name in NonNullable<Alternates>]?: string }
			| Record<string, string>
		);
	}
);

export type Match<Groups extends string> = RegExpGroups<Groups> | null; // eslint-disable-line @typescript-eslint/ban-types

export type MatchAll<Groups extends string, Alternates extends string> = IterableIterator<RegExpGroups<Groups, Alternates>>;
