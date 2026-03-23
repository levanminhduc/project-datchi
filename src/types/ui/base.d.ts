/**
 * Base types for UI components
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Color = 'primary' | 'secondary' | 'accent' | 'positive' | 'negative' | 'info' | 'warning' | 'dark' | 'white';
export type ButtonVariant = 'filled' | 'outlined' | 'flat' | 'text';
export interface BaseComponentProps {
    class?: string;
    style?: string | Record<string, string>;
}
export type ValidationRule = ((val: any) => boolean | string) | ((val: any) => Promise<boolean | string>);
export interface LabeledProps {
    label?: string;
    hint?: string;
}
export interface ValidatableProps {
    rules?: ValidationRule[];
    required?: boolean;
    errorMessage?: string;
}
export interface PaginationConfig {
    page: number;
    rowsPerPage: number;
    sortBy?: string;
    descending?: boolean;
    rowsNumber?: number;
}
export interface UISelectOption<T = any> {
    label: string;
    value: T;
    disable?: boolean;
    description?: string;
    icon?: string;
}
export interface UIMenuItem {
    label: string;
    icon?: string;
    value?: any;
    separator?: boolean;
    disable?: boolean;
    to?: string;
    href?: string;
    onClick?: () => void;
}
