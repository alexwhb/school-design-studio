import './createDesign.less';
export type CreateDesignHandle = {
    open: () => void;
};
/**
 * Starting a new design.
 *
 * Only that. This dialog used to double as the page-size editor for an existing
 * design, with a checkbox deciding whether the artwork moved with it — but that
 * only ever resized the page you were looking at, which quietly left a
 * multi-page design with pages of different sizes. Resizing something that
 * already exists is its own question, and it is asked in ResizeDesign.
 */
declare const CreateDesign: import("react").ForwardRefExoticComponent<import("react").RefAttributes<CreateDesignHandle>>;
export default CreateDesign;
