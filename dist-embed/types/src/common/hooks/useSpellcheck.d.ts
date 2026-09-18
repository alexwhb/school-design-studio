export declare const SPELLCHECK_STORAGE_KEY = "ds_spellcheck";
export declare function setSpellcheck(next: boolean): void;
export declare function toggleSpellcheck(): void;
export declare function getSpellcheck(): boolean;
export default function useSpellcheck(): {
    enabled: boolean;
    setSpellcheck: typeof setSpellcheck;
    toggleSpellcheck: typeof toggleSpellcheck;
};
