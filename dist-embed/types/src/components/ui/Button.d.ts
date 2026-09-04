import { type ButtonHTMLAttributes, type ReactNode } from 'react';
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    nativeType?: 'button' | 'submit' | 'reset';
    plain?: boolean;
    text?: boolean;
    link?: boolean;
    round?: boolean;
    circle?: boolean;
    size?: 'large' | 'default' | 'small';
    children?: ReactNode;
};
/**
 * Ref-forwarding, because Radix's `asChild` triggers — tooltips, dropdowns,
 * popovers — clone the child and hand it a ref to position against.
 */
declare const Button: import("react").ForwardRefExoticComponent<Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    type?: "primary" | "success" | "warning" | "info" | "default" | "danger" | undefined;
    nativeType?: "button" | "reset" | "submit" | undefined;
    plain?: boolean | undefined;
    text?: boolean | undefined;
    link?: boolean | undefined;
    round?: boolean | undefined;
    circle?: boolean | undefined;
    size?: "small" | "default" | "large" | undefined;
    children?: ReactNode;
} & import("react").RefAttributes<HTMLButtonElement>>;
export default Button;
