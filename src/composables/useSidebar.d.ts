import type { NavItem } from '@/types/navigation';
export declare function useSidebar(): {
    isOpen: any;
    navItems: NavItem[];
    toggle: () => void;
    open: () => void;
    close: () => void;
};
