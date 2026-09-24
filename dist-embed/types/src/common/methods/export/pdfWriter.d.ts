/**
 * The mechanical half of writing a PDF: objects, byte offsets, the table at
 * the end that says where each one starts.
 *
 * A PDF is a list of numbered objects followed by a cross-reference table
 * giving the byte offset of every one of them. A reader seeks straight to those
 * offsets, so a single wrong number is not a rendering glitch — it is a file
 * that opens as "damaged". Keeping the counting in one place, away from the
 * document's structure, is the difference between that being a class of bug and
 * being impossible.
 *
 * Ids are handed out before bodies are written, because the document is full of
 * forward references: the catalogue names the page tree, the page tree lists
 * pages, and a structure element points back at the page it appears on.
 */
export declare class PdfWriter {
    private parts;
    private length;
    private offsets;
    private nextId;
    private readonly encoder;
    /** Reserves an object number. Nothing is written until `object` is called. */
    alloc(): number;
    /** A reference to an object, in the `n 0 R` form every dictionary uses. */
    static ref(id: number): string;
    private put;
    begin(): void;
    /** Writes a plain object — a dictionary or an array, as a string. */
    object(id: number, body: string): void;
    /**
     * Writes a stream object: a dictionary, then the bytes.
     *
     * `/Length` is filled in from the data rather than trusted from the caller,
     * which is the one number in a stream nobody can afford to get wrong.
     */
    stream(id: number, dict: string, data: string | Uint8Array): void;
    /** Writes the cross-reference table and trailer, and hands back the file. */
    finish(trailer: string): Blob;
}
/** Trims float noise out of the numbers written into the file. */
export declare const num: (value: number) => string;
/**
 * A PDF text string as UTF-16BE hex.
 *
 * The alternative is a literal string, which then has to escape backslashes and
 * both parentheses, and still cannot carry an accent. Design names and alt text
 * come from people, so they carry accents.
 */
export declare function pdfString(value: string): string;
export declare function pdfDate(date: Date): string;
