/** How the cells in a row are separated. `'\n'` means one cell per line. */
export type TDelimiter = ',' | '\t' | ';' | '\n';
export type TTable = {
    /** One name per column: the header row if there is one, "Column 1" and so on if not. */
    columns: string[];
    /** The people, one row each, every row padded to the width of the widest. */
    rows: string[][];
    /** Whether the first row was read as column names. */
    header: boolean;
    delimiter: TDelimiter;
};
/**
 * Which separator the text is using.
 *
 * A separator that appears the same number of times on every line is almost
 * certainly the one in use; a comma inside a name is on one line, not all of
 * them. Where two are consistent — "Lovelace, Ada;Year 6" — the semicolon or the
 * tab is the deliberate one, because commas turn up in ordinary text and those
 * two do not. With nothing consistent, the busiest one wins; with nothing at
 * all, the list is one name per line.
 */
export declare function detectDelimiter(text: string): TDelimiter;
/**
 * The text as rows of trimmed cells. Quotes follow the spreadsheet convention:
 * a cell that starts with a quote runs to the closing quote, a doubled quote
 * inside it is a literal one, and a line break inside it is part of the cell.
 * Rows with nothing in them are dropped, wherever they fall.
 */
export declare function parseTable(text: string, delimiter?: TDelimiter): string[][];
/**
 * Whether the first row names the columns rather than being a person.
 *
 * A header has no numbers in it, no blanks, and no column named twice; and it
 * is a different shape from the row beneath it — "Grade" over "Year 6", "Name"
 * over "Ada Lovelace". A single row is taken to be a person, since a header with
 * nobody under it is a list of no one.
 */
export declare function detectHeader(rows: string[][]): boolean;
/**
 * The whole thing: separator found, rows parsed, header decided — or taken as
 * given, once the person has said which it is.
 */
export declare function readTable(text: string, header?: boolean): TTable;
