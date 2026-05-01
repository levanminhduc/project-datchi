/**
 * Types for Quasar components
 */
export interface BaseProps {
    class?: string;
    style?: string | Record<string, string>;
}
export interface DataTableColumn {
    name: string;
    label: string;
    field: string | ((row: Record<string, unknown>) => unknown);
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    format?: (val: unknown) => string;
    style?: string;
    classes?: string;
}
export interface SelectOption {
    label: string;
    value: string | number;
}
export interface TreeNode {
    label: string;
    id: string;
    children?: TreeNode[];
    icon?: string;
    expandable?: boolean;
}
export interface CarouselSlide {
    src: string;
    caption?: string;
}
export interface ExpansionItem {
    label: string;
    caption?: string;
    icon?: string;
    value?: unknown;
}
export interface MenuItem {
    label: string;
    icon?: string;
    value?: unknown;
    separator?: boolean;
    disable?: boolean;
}
export interface TimelineEntry {
    title: string;
    subtitle?: string;
    body?: string;
    color?: string;
    icon?: string;
    side?: 'left' | 'right';
}
export interface ListItem {
    label: string;
    caption?: string;
    icon?: string;
    avatar?: string;
    value?: unknown;
    disable?: boolean;
    to?: string;
    href?: string;
}
export interface TabConfig {
    name: string;
    label: string;
    icon?: string;
    disable?: boolean;
}
export interface NavItem {
    value: unknown;
    icon: string;
    label: string;
}
export interface RadioOption {
    label: string;
    value: unknown;
}
export interface ChipItem {
    label: string;
    value?: unknown;
    color?: string;
    icon?: string;
    removable?: boolean;
}
