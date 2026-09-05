export type ThemePreference = 'system' | 'light' | 'dark';
export declare const THEME_STORAGE_KEY = "ds_theme";
/**
 * Where the theme class goes. Standalone that is <html>; embedded it is the
 * editor's own root, so the host app's appearance is left alone.
 */
export declare function setThemeTarget(element: HTMLElement, className?: string): void;
/**
 * Hands the theme back. Clears the class off the element the editor was
 * painting and leaves the host document untouched — painting <html> here is
 * how an unmounting embedded editor used to darken the page around it.
 */
export declare function clearThemeTarget(): void;
export declare function setThemePreference(next: ThemePreference, persist?: boolean): void;
/**
 * Paints the theme onto <html>. Only the standalone app calls this — an
 * embedded editor paints its own root instead, and must not touch the page it
 * is a guest on.
 */
export declare function initStandaloneTheme(): void;
export declare function toggleTheme(): void;
export declare function getResolvedTheme(): "light" | "dark";
export default function useTheme(): {
    preference: ThemePreference;
    resolved: "light" | "dark";
    setThemePreference: typeof setThemePreference;
    toggleTheme: typeof toggleTheme;
};
