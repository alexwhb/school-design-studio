declare const config: {
    isDev: boolean;
    BASE_URL: string;
    VERSION: string;
    APP_NAME: string;
    HOME_URL: string;
    COPYRIGHT: string;
    API_URL: string;
    SCREEN_URL: string;
    ICONFONT_URL: string;
    supportSubFont: boolean;
    BACKGROUND_REMOVAL: boolean;
    /** A repository on the Hugging Face hub, or a folder of the same shape served yourself. */
    BACKGROUND_REMOVAL_MODEL: string;
    /**
     * Set to hand the work to a server instead of doing it in the browser: the
     * picture is POSTed as the whole request body, and the reply should be a PNG
     * with a transparent background.
     */
    BACKGROUND_REMOVAL_URL: string;
};
export type DesignStudioConfig = Partial<typeof config>;
/** Lets a host app point the editor at its own backend and home page. */
export declare function configure(overrides: DesignStudioConfig): void;
export default config;
export declare const LocalStorageKey: {
    tokenKey: string;
};
