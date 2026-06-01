# YourEx Challenge — Suggested Answers

Below are the suggested answers organized by level. Each entry contains three parts:

- Suggested Answer: A prompt you can submit directly to the AI.
- Expected Regex: A reasonable result the prompt is expected to produce.
- Explanation: Why this approach passes the level.

## Chapter 1: Signal Contact

### Level 01 - Hello, rEx

- Suggested Answer: Generate a case-sensitive regex that matches any line containing the lowercase word `hello`. Do not match `HELLO`, `help`, or `helicopter`.
- Expected Regex: `/hello/`
- Explanation: Directly matches the lowercase substring `hello`. Case-sensitive by default, so `HELLO` won't match.

### Level 02 - Signal in Noise

- Suggested Answer: Generate a regex that matches any line containing at least one digit.
- Expected Regex: `/\d/`
- Explanation: `\d` represents any digit character; a single occurrence anywhere in the line is enough.

### Level 03 - Signal Coordinates

- Suggested Answer: Generate a regex that fully matches a valid email address from start to end: username@domain.tld.
- Expected Regex: `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/`
- Explanation: `^...$` anchors the entire line; the local part allows common characters; the domain requires a dot and a TLD of at least two letters.

### Level 04 - Echo Pattern

- Suggested Answer: Generate a regex that matches lines containing consecutively repeated words (the same word appearing twice in a row, separated by whitespace).
- Expected Regex: `/\b(\w+)\s+\1\b/`
- Explanation: `(\w+)` captures a word, `\1` requires the same word immediately after, and `\b` ensures complete word boundaries.

### Level 05 - Still There?

- Suggested Answer: Generate a regex that matches all lines ending with `.signal`, treating the dot as a literal character.
- Expected Regex: `/\.signal$/`
- Explanation: `\.` escapes the dot to a literal, and `$` anchors to the end of the line. `.signals` won't match.

## Chapter 2: Pattern Recognition

### Level 06 - Hidden Token

- Suggested Answer: Generate a regex that matches lines containing an exactly 8-character token composed of uppercase letters and digits.
- Expected Regex: `/\b[A-Z0-9]{8}\b/`
- Explanation: `[A-Z0-9]{8}` requires exactly 8 uppercase letters or digits, and `\b` prevents matching a substring of a longer token.

### Level 07 - Broken Syntax

- Suggested Answer: Generate a regex that fully matches a valid variable name: starting with a letter or underscore, followed by letters, digits, or underscores.
- Expected Regex: `/^[A-Za-z_][A-Za-z0-9_]*$/`
- Explanation: The first character is restricted to letters or underscore; subsequent characters also allow digits. `^...$` requires a full-line match.

### Level 08 - Encoded Digits

- Suggested Answer: Generate a regex that fully matches a hexadecimal number: starting with `0x`, followed by one or more hex characters (0-9, a-f, A-F).
- Expected Regex: `/^0x[0-9A-Fa-f]+$/`
- Explanation: `0x` is the fixed prefix, `[0-9A-Fa-f]+` requires at least one hex digit, and `^...$` anchors the full line.

### Level 09 - Partial Truth

- Suggested Answer: Generate a regex that fully matches `YYYY-MM-DD` date format, restricting months to 01-12 and days to 01-31.
- Expected Regex: `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`
- Explanation: Year is 4 digits; month uses `0[1-9]|1[0-2]` for 01-12; day uses `0[1-9]|[12]\d|3[01]` for 01-31.

### Level 10 - Repeat Protocol

- Suggested Answer: Generate a regex that fully matches a string composed of the same letter repeated 3 to 5 times.
- Expected Regex: `/^([A-Za-z])\1{2,4}$/`
- Explanation: `([A-Za-z])` captures one letter, `\1{2,4}` requires 2 to 4 more repetitions, for a total of 3 to 5.

## Chapter 3: Syntax Awakening

### Level 11 - Time Signature

- Suggested Answer: Generate a regex that fully matches 24-hour time in `HH:MM` format, with hours 00-23 and minutes 00-59.
- Expected Regex: `/^(?:[01]\d|2[0-3]):[0-5]\d$/`
- Explanation: Hours use `[01]\d|2[0-3]` to cover 00-23; minutes use `[0-5]\d` to cover 00-59.

### Level 12 - Unknown Coordinates

- Suggested Answer: Generate a regex that fully matches coordinate pairs in `(number, number)` format, where numbers can be integers or decimals.
- Expected Regex: `/^\(\d+(?:\.\d+)?, \d+(?:\.\d+)?\)$/`
- Explanation: `\(` and `\)` match literal parentheses; `\d+(?:\.\d+)?` matches integers or decimals; a comma and space separate the two values.

### Level 13 - Sealed Packets

- Suggested Answer: Generate a regex that fully matches self-closing HTML tags (starting with `<` and ending with `/>`).
- Expected Regex: `/^<[^>]*\/>$/`
- Explanation: `<` opens the tag, `[^>]*` matches any characters except `>` (tag name and attributes), and `\/>` marks the self-closing end.

### Level 14 - Either / Or

- Suggested Answer: Generate a regex that fully matches URLs starting with `http://` or `https://`.
- Expected Regex: `/^https?:\/\/\S+$/`
- Explanation: `https?` makes the `s` optional to cover both http and https; `\S+` matches subsequent non-whitespace characters.

### Level 15 - Memory Blocks

- Suggested Answer: Generate a regex that fully matches double-quoted strings, supporting internal `\"` and `\\` escape sequences.
- Expected Regex: `/^"([^"\\]|\\.)*"$/`
- Explanation: `[^"\\]` matches normal characters, `\\.` matches escape sequences (like `\"` or `\\`), all wrapped in double quotes.

## Chapter 4: Transmission

### Level 16 - Message Header

- Suggested Answer: Generate a regex that matches lines containing a `[TYPE-CODE]` message header, where TYPE is uppercase letters and CODE is digits.
- Expected Regex: `/\[[A-Z]+-\d+\]/`
- Explanation: `\[...\]` matches square brackets; `[A-Z]+` for one or more uppercase letters; `-` hyphen; `\d+` for one or more digits.

### Level 17 - Protocol Sync

- Suggested Answer: Generate a regex that fully matches `key=value` pairs. Key is lowercase letters only; value is either a number or a double-quoted string.
- Expected Regex: `/^[a-z]+=(\d+|"[^"]*")$/`
- Explanation: `[a-z]+` restricts the key to lowercase letters; after `=`, alternation `|` selects between a number or a quoted string.

### Level 18 - Nested Signal

- Suggested Answer: Generate a regex that fully matches function call expressions `funcName(args)`. The function name starts with a letter; the argument list can be empty.
- Expected Regex: `/^[a-zA-Z]\w*\(.*\)$/`
- Explanation: `[a-zA-Z]\w*` matches a valid function name; `\(.*\)` matches parentheses with any content inside (including empty).

### Level 19 - Corrupted Packet

- Suggested Answer: Generate a regex that fully matches a valid IPv4 address — four dot-separated numbers, each in the range 0-255.
- Expected Regex: `/^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/`
- Explanation: Each octet uses `25[0-5]|2[0-4]\d|[01]?\d\d?` to precisely constrain the 0-255 range, repeated for all four segments.

### Level 20 - Reconstruction

- Suggested Answer: Generate a regex that fully matches log entries in `[HH:MM:SS] LEVEL: message` format. Time is 24-hour; LEVEL must be INFO, WARN, or ERROR.
- Expected Regex: `/^\[(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\] (?:INFO|WARN|ERROR): .+$/`
- Explanation: Brackets contain HH:MM:SS time; a space is followed by one of three valid levels via `|`; after the colon is the message content.

## Chapter 5: rEx

### Level 21 - Full Decode

- Suggested Answer: Generate a regex that matches lines containing a letter immediately followed by a digit (no space between them).
- Expected Regex: `/[a-zA-Z]\d/`
- Explanation: `[a-zA-Z]` matches a letter directly followed by `\d` for a digit, with no separator in between.

### Level 22 - Not Just Pattern

- Suggested Answer: Generate a regex that fully matches a strong password: at least 8 characters, containing at least one uppercase letter, one lowercase letter, and one digit.
- Expected Regex: `/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/`
- Explanation: Three lookahead assertions ensure the presence of uppercase, lowercase, and digit respectively; `.{8,}` enforces minimum length of 8.

### Level 23 - Language Formed

- Suggested Answer: Generate a regex that fully matches an email address: user@domain.tld, where the domain must contain a dot.
- Expected Regex: `/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/`
- Explanation: The local part allows alphanumerics and `._%+-`; after `@`, the domain includes a dot; the TLD requires at least two letters.

### Level 24 - You Understand

- Suggested Answer: Generate a regex that fully matches Markdown links `[text](url)`, excluding image syntax `![text](url)`.
- Expected Regex: `/^\[[^\]]+\]\([^)]+\)$/`
- Explanation: `^\[` requires the line to start with `[` (excluding `!`-prefixed images); `[^\]]+` matches the text; `\([^)]+\)` matches the URL.

### Level 25 - rEx

- Suggested Answer: Generate a regex that fully matches the `rEx{TYPE:CONTENT}` format. `rEx` is case-sensitive, TYPE is uppercase letters, CONTENT contains no curly braces.
- Expected Regex: `/^rEx\{[A-Z]+:[^}]+\}$/`
- Explanation: `rEx` is a literal match (case-sensitive); `\{...\}` matches curly braces; `[A-Z]+` for the type; `[^}]+` for the content.

## Chapter 6: Origin

### Level 26 - Fault Bus

- Suggested Answer: Generate a regex to match valid repair fault frames in hex dump data. Frame rules: byte 0 is `19`, bytes 2-4 are `00 00 01`, byte 15 is `7E`; fault code and repair action must match the lookup table (F1 0A→A0 11, F2 1C→B4 02, E9 7D→C8 3F).
- Expected Regex: `/^19 [0-9A-Fa-f]{2} 00 00 01 (?:F1 0A A0 11|F2 1C B4 02|E9 7D C8 3F)(?: [0-9A-Fa-f]{2}){6} 7E$/gm`
- Explanation: Fixed header `19` + any byte + `00 00 01`; alternation `|` enumerates the three valid fault-code→action mappings; 6 arbitrary bytes in the middle; trailer `7E`. The `gm` flags are required: the judge merges all input lines into a single newline-joined string, so `m` makes `^`/`$` match per-line boundaries instead of the full string, and `g` collects every matching frame.
