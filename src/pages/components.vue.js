"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
// ===== Component Imports =====
// Buttons
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var IconButton_vue_1 = require("@/components/ui/buttons/IconButton.vue");
var ButtonGroup_vue_1 = require("@/components/ui/buttons/ButtonGroup.vue");
var ButtonToggle_vue_1 = require("@/components/ui/buttons/ButtonToggle.vue");
var ButtonDropdown_vue_1 = require("@/components/ui/buttons/ButtonDropdown.vue");
// Inputs
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var AppCheckbox_vue_1 = require("@/components/ui/inputs/AppCheckbox.vue");
var AppToggle_vue_1 = require("@/components/ui/inputs/AppToggle.vue");
var AppSlider_vue_1 = require("@/components/ui/inputs/AppSlider.vue");
var AppRange_vue_1 = require("@/components/ui/inputs/AppRange.vue");
var SearchInput_vue_1 = require("@/components/ui/inputs/SearchInput.vue");
// Dialogs
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var ConfirmDialog_vue_1 = require("@/components/ui/dialogs/ConfirmDialog.vue");
var DeleteDialog_vue_1 = require("@/components/ui/dialogs/DeleteDialog.vue");
var AppMenu_vue_1 = require("@/components/ui/dialogs/AppMenu.vue");
var AppTooltip_vue_1 = require("@/components/ui/dialogs/AppTooltip.vue");
var PopupEdit_vue_1 = require("@/components/ui/dialogs/PopupEdit.vue");
// Feedback
var AppSpinner_vue_1 = require("@/components/ui/feedback/AppSpinner.vue");
var CircularProgress_vue_1 = require("@/components/ui/feedback/CircularProgress.vue");
var AppProgress_vue_1 = require("@/components/ui/feedback/AppProgress.vue");
var AppSkeleton_vue_1 = require("@/components/ui/feedback/AppSkeleton.vue");
var EmptyState_vue_1 = require("@/components/ui/feedback/EmptyState.vue");
var AppBanner_vue_1 = require("@/components/ui/feedback/AppBanner.vue");
var InnerLoading_vue_1 = require("@/components/ui/feedback/InnerLoading.vue");
// Navigation
var AppTabs_vue_1 = require("@/components/ui/navigation/AppTabs.vue");
var TabPanel_vue_1 = require("@/components/ui/navigation/TabPanel.vue");
var AppStepper_vue_1 = require("@/components/ui/navigation/AppStepper.vue");
var StepperStep_vue_1 = require("@/components/ui/navigation/StepperStep.vue");
var AppPagination_vue_1 = require("@/components/ui/navigation/AppPagination.vue");
var AppBreadcrumbs_vue_1 = require("@/components/ui/navigation/AppBreadcrumbs.vue");
var SidebarItem_vue_1 = require("@/components/ui/navigation/SidebarItem.vue");
// Layout
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var SectionHeader_vue_1 = require("@/components/ui/layout/SectionHeader.vue");
var AppToolbar_vue_1 = require("@/components/ui/layout/AppToolbar.vue");
var AppSeparator_vue_1 = require("@/components/ui/layout/AppSeparator.vue");
var AppSpace_vue_1 = require("@/components/ui/layout/AppSpace.vue");
// Cards
var AppCard_vue_1 = require("@/components/ui/cards/AppCard.vue");
var InfoCard_vue_1 = require("@/components/ui/cards/InfoCard.vue");
var StatCard_vue_1 = require("@/components/ui/cards/StatCard.vue");
var AppChip_vue_1 = require("@/components/ui/cards/AppChip.vue");
var AppBadge_vue_1 = require("@/components/ui/cards/AppBadge.vue");
// Lists
var AppList_vue_1 = require("@/components/ui/lists/AppList.vue");
var ListItem_vue_1 = require("@/components/ui/lists/ListItem.vue");
// Media
var AppImage_vue_1 = require("@/components/ui/media/AppImage.vue");
var AppCarousel_vue_1 = require("@/components/ui/media/AppCarousel.vue");
var AppParallax_vue_1 = require("@/components/ui/media/AppParallax.vue");
// Pickers
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var TimePicker_vue_1 = require("@/components/ui/pickers/TimePicker.vue");
var ColorPicker_vue_1 = require("@/components/ui/pickers/ColorPicker.vue");
var FilePicker_vue_1 = require("@/components/ui/pickers/FilePicker.vue");
var AppEditor_vue_1 = require("@/components/ui/pickers/AppEditor.vue");
// Scroll
var ScrollArea_vue_1 = require("@/components/ui/scroll/ScrollArea.vue");
var VirtualScroll_vue_1 = require("@/components/ui/scroll/VirtualScroll.vue");
var InfiniteScroll_vue_1 = require("@/components/ui/scroll/InfiniteScroll.vue");
var Timeline_vue_1 = require("@/components/ui/scroll/Timeline.vue");
var TimelineEntry_vue_1 = require("@/components/ui/scroll/TimelineEntry.vue");
// ===== ComponentCard for showcase =====
var ComponentCard_vue_1 = require("@/components/showcase/ComponentCard.vue");
// ===== Tab Configuration =====
var tabs = [
    { name: 'buttons', label: 'Buttons', icon: 'smart_button' },
    { name: 'inputs', label: 'Inputs', icon: 'input' },
    { name: 'dialogs', label: 'Dialogs', icon: 'web_asset' },
    { name: 'feedback', label: 'Feedback', icon: 'notifications' },
    { name: 'navigation', label: 'Navigation', icon: 'menu' },
    { name: 'layout', label: 'Layout', icon: 'dashboard' },
    { name: 'cards', label: 'Cards', icon: 'credit_card' },
    { name: 'lists', label: 'Lists', icon: 'list' },
    { name: 'media', label: 'Media', icon: 'perm_media' },
    { name: 'pickers', label: 'Pickers & Scroll', icon: 'date_range' },
];
var activeTab = (0, vue_1.ref)('buttons');
// ===== Demo State =====
// Buttons
var toggleValue = (0, vue_1.ref)('left');
// Inputs
var inputValue = (0, vue_1.ref)('');
var selectValue = (0, vue_1.ref)(null);
var multiSelectValue = (0, vue_1.ref)([]);
var textareaValue = (0, vue_1.ref)('');
var checkbox1 = (0, vue_1.ref)(true);
var checkbox2 = (0, vue_1.ref)(false);
var toggle1 = (0, vue_1.ref)(true);
var toggle2 = (0, vue_1.ref)(false);
var sliderValue = (0, vue_1.ref)(50);
var rangeValue = (0, vue_1.ref)({ min: 20, max: 80 });
var searchValue = (0, vue_1.ref)('');
// Dialogs
var showAppDialog = (0, vue_1.ref)(false);
var showFormDialog = (0, vue_1.ref)(false);
var showConfirmDialog = (0, vue_1.ref)(false);
var showDeleteDialog = (0, vue_1.ref)(false);
var editableText = (0, vue_1.ref)('Nguyễn Văn A');
// Feedback
var showBanner = (0, vue_1.ref)(true);
var showInnerLoading = (0, vue_1.ref)(false);
// Navigation
var demoTab = (0, vue_1.ref)('tab1');
var stepValue = (0, vue_1.ref)(1);
var pageValue = (0, vue_1.ref)(1);
// Layout
var showDrawer = (0, vue_1.ref)(false);
// Media
var carouselSlide = (0, vue_1.ref)(0);
var carouselSlides = [
    { src: 'https://cdn.quasar.dev/img/mountains.jpg', title: 'Núi' },
    { src: 'https://cdn.quasar.dev/img/parallax1.jpg', title: 'Bầu trời' },
    { src: 'https://cdn.quasar.dev/img/parallax2.jpg', title: 'Vũ trụ' },
];
// Pickers
var dateValue = (0, vue_1.ref)(null);
var timeValue = (0, vue_1.ref)(null);
var colorValue = (0, vue_1.ref)('#1976D2');
var fileValue = (0, vue_1.ref)(null);
var editorValue = (0, vue_1.ref)('<p>Nội dung <b>rich text</b> editor</p>');
// Scroll
var virtualItems = Array.from({ length: 1000 }, function (_, i) { return i + 1; });
var infiniteItems = (0, vue_1.ref)([1, 2, 3, 4, 5]);
var onInfiniteLoad = function (_, done) {
    setTimeout(function () {
        var last = infiniteItems.value[infiniteItems.value.length - 1] || 0;
        for (var i = 1; i <= 5; i++) {
            infiniteItems.value.push(last + i);
        }
        done(infiniteItems.value.length > 50);
    }, 500);
};
var appButtonProps = [
    { name: 'color', type: 'Color | string', default: 'primary', description: 'Màu nút' },
    { name: 'size', type: 'Size', default: 'md', description: 'Kích thước: xs, sm, md, lg, xl' },
    { name: 'variant', type: 'ButtonVariant', default: 'filled', description: 'Kiểu: filled, outlined, flat, text' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Hiện spinner loading' },
    { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa nút' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon Material bên trái' },
    { name: 'iconRight', type: 'string', default: '-', description: 'Icon bên phải' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn nút' },
    { name: 'round', type: 'boolean', default: 'false', description: 'Nút tròn' },
    { name: 'block', type: 'boolean', default: 'false', description: 'Full width' },
];
var iconButtonProps = [
    { name: 'icon', type: 'string', default: 'required', description: 'Tên icon Material' },
    { name: 'color', type: 'Color | string', default: 'primary', description: 'Màu icon' },
    { name: 'size', type: 'Size', default: 'md', description: 'Kích thước' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Hiện loading' },
    { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
];
var buttonGroupProps = [
    { name: 'spread', type: 'boolean', default: 'false', description: 'Căn đều các nút' },
    { name: 'outline', type: 'boolean', default: 'false', description: 'Kiểu viền' },
    { name: 'flat', type: 'boolean', default: 'false', description: 'Kiểu phẳng' },
    { name: 'rounded', type: 'boolean', default: 'false', description: 'Bo góc' },
];
var buttonToggleProps = [
    { name: 'modelValue', type: 'any', default: '-', description: 'Giá trị v-model' },
    { name: 'options', type: 'Array', default: 'required', description: 'Mảng options {label, value, icon}' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu toggle' },
    { name: 'spread', type: 'boolean', default: 'false', description: 'Căn đều' },
];
var buttonDropdownProps = [
    { name: 'label', type: 'string', default: '-', description: 'Nhãn nút' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon nút' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu nút' },
    { name: 'split', type: 'boolean', default: 'false', description: 'Tách nút và dropdown' },
];
var appInputProps = [
    { name: 'modelValue', type: 'string | number', default: '-', description: 'Giá trị v-model' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn input' },
    { name: 'type', type: 'string', default: 'text', description: 'Loại input: text, password, email, number...' },
    { name: 'placeholder', type: 'string', default: '-', description: 'Placeholder' },
    { name: 'outlined', type: 'boolean', default: 'true', description: 'Kiểu viền' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Bắt buộc nhập' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Hiện nút xóa' },
    { name: 'prependIcon', type: 'string', default: '-', description: 'Icon đầu' },
    { name: 'appendIcon', type: 'string', default: '-', description: 'Icon cuối' },
    { name: 'mask', type: 'string', default: '-', description: 'Input mask' },
];
var appSelectProps = [
    { name: 'modelValue', type: 'any', default: '-', description: 'Giá trị v-model' },
    { name: 'options', type: 'Array', default: 'required', description: 'Danh sách options' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn select' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Cho phép chọn nhiều' },
    { name: 'useChips', type: 'boolean', default: 'false', description: 'Hiện chips khi multiple' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Cho phép xóa' },
];
var appTextareaProps = [
    { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị v-model' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
    { name: 'autogrow', type: 'boolean', default: 'false', description: 'Tự động tăng chiều cao' },
    { name: 'rows', type: 'number', default: '3', description: 'Số dòng' },
    { name: 'counter', type: 'boolean', default: 'false', description: 'Hiện đếm ký tự' },
    { name: 'maxlength', type: 'number', default: '-', description: 'Giới hạn ký tự' },
];
var appCheckboxProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Giá trị v-model' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
    { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
];
var appToggleProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Giá trị v-model' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
    { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
];
var appSliderProps = [
    { name: 'modelValue', type: 'number', default: '0', description: 'Giá trị v-model' },
    { name: 'min', type: 'number', default: '0', description: 'Giá trị min' },
    { name: 'max', type: 'number', default: '100', description: 'Giá trị max' },
    { name: 'step', type: 'number', default: '1', description: 'Bước nhảy' },
    { name: 'label', type: 'boolean', default: 'false', description: 'Hiện label giá trị' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
];
var appRangeProps = [
    { name: 'modelValue', type: '{min, max}', default: '-', description: 'Giá trị v-model' },
    { name: 'min', type: 'number', default: '0', description: 'Giá trị min' },
    { name: 'max', type: 'number', default: '100', description: 'Giá trị max' },
    { name: 'label', type: 'boolean', default: 'false', description: 'Hiện labels' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
];
var searchInputProps = [
    { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị v-model' },
    { name: 'placeholder', type: 'string', default: 'Tìm kiếm...', description: 'Placeholder' },
    { name: 'debounce', type: 'number', default: '300', description: 'Delay debounce (ms)' },
    { name: 'clearable', type: 'boolean', default: 'true', description: 'Hiện nút xóa' },
];
var appDialogProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
    { name: 'persistent', type: 'boolean', default: 'false', description: 'Không đóng khi click backdrop' },
    { name: 'maximized', type: 'boolean', default: 'false', description: 'Phóng to full màn hình' },
    { name: 'position', type: 'DialogPosition', default: 'standard', description: 'Vị trí: standard, top, bottom...' },
];
var formDialogProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
    { name: 'title', type: 'string', default: '-', description: 'Tiêu đề dialog' },
    { name: 'submitText', type: 'string', default: 'Lưu', description: 'Text nút submit' },
    { name: 'cancelText', type: 'string', default: 'Hủy', description: 'Text nút hủy' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Trạng thái loading' },
];
var confirmDialogProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
    { name: 'title', type: 'string', default: 'Xác nhận', description: 'Tiêu đề' },
    { name: 'message', type: 'string', default: 'required', description: 'Nội dung xác nhận' },
    { name: 'confirmText', type: 'string', default: 'Đồng ý', description: 'Text nút confirm' },
    { name: 'type', type: 'DialogType', default: 'info', description: 'Loại: info, warning, error, success' },
];
var deleteDialogProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
    { name: 'itemName', type: 'string', default: '-', description: 'Tên item cần xóa' },
    { name: 'requireConfirmation', type: 'boolean', default: 'false', description: 'Yêu cầu nhập tên để xác nhận' },
];
var appMenuProps = [
    { name: 'items', type: 'UIMenuItem[]', default: 'required', description: 'Danh sách menu items' },
    { name: 'anchor', type: 'string', default: 'bottom left', description: 'Điểm neo trên target' },
    { name: 'autoClose', type: 'boolean', default: 'true', description: 'Tự động đóng khi click' },
];
var appTooltipProps = [
    { name: 'text', type: 'string', default: 'required', description: 'Nội dung tooltip' },
    { name: 'anchor', type: 'string', default: 'top middle', description: 'Điểm neo' },
    { name: 'delay', type: 'number', default: '0', description: 'Delay hiện (ms)' },
    { name: 'maxWidth', type: 'string', default: '-', description: 'Chiều rộng tối đa' },
];
var popupEditProps = [
    { name: 'modelValue', type: 'any', default: '-', description: 'Giá trị chỉnh sửa' },
    { name: 'title', type: 'string', default: '-', description: 'Tiêu đề popup' },
    { name: 'buttons', type: 'boolean', default: 'true', description: 'Hiện nút Save/Cancel' },
    { name: 'autoSave', type: 'boolean', default: 'false', description: 'Tự động lưu' },
];
var appSpinnerProps = [
    { name: 'size', type: 'Size | string', default: 'md', description: 'Kích thước' },
    { name: 'color', type: 'Color | string', default: 'primary', description: 'Màu' },
    { name: 'thickness', type: 'number', default: '5', description: 'Độ dày' },
];
var circularProgressProps = [
    { name: 'value', type: 'number', default: '0', description: 'Giá trị 0-1' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Chế độ indeterminate' },
    { name: 'size', type: 'string', default: '100px', description: 'Kích thước' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Hiện giá trị' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
];
var appProgressProps = [
    { name: 'value', type: 'number', default: '0', description: 'Giá trị 0-1' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Chế độ indeterminate' },
    { name: 'stripe', type: 'boolean', default: 'false', description: 'Hiệu ứng sọc' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
    { name: 'size', type: 'string', default: '-', description: 'Chiều cao' },
];
var appSkeletonProps = [
    { name: 'type', type: 'string', default: 'rect', description: 'Loại: text, rect, circle, QBtn...' },
    { name: 'animation', type: 'string', default: 'wave', description: 'Animation: wave, pulse, fade...' },
    { name: 'width', type: 'string', default: '-', description: 'Chiều rộng' },
    { name: 'height', type: 'string', default: '-', description: 'Chiều cao' },
    { name: 'size', type: 'string', default: '-', description: 'Kích thước (cho circle)' },
];
var emptyStateProps = [
    { name: 'icon', type: 'string', default: 'inbox', description: 'Icon hiển thị' },
    { name: 'iconSize', type: 'string', default: '64px', description: 'Kích thước icon' },
    { name: 'title', type: 'string', default: '-', description: 'Tiêu đề' },
    { name: 'subtitle', type: 'string', default: '-', description: 'Mô tả phụ' },
];
var appBannerProps = [
    { name: 'modelValue', type: 'boolean', default: 'true', description: 'Hiển thị/ẩn' },
    { name: 'inline', type: 'boolean', default: 'false', description: 'Không có padding' },
    { name: 'rounded', type: 'boolean', default: 'false', description: 'Bo góc' },
];
var innerLoadingProps = [
    { name: 'showing', type: 'boolean', default: 'false', description: 'Hiển thị loading' },
    { name: 'dark', type: 'boolean', default: 'false', description: 'Overlay tối' },
    { name: 'label', type: 'string', default: '-', description: 'Text hiển thị' },
    { name: 'size', type: 'Size', default: 'md', description: 'Kích thước spinner' },
];
var appTabsProps = [
    { name: 'modelValue', type: 'string | number', default: '-', description: 'Tab active' },
    { name: 'vertical', type: 'boolean', default: 'false', description: 'Hướng dọc' },
    { name: 'dense', type: 'boolean', default: 'false', description: 'Compact' },
    { name: 'align', type: 'string', default: 'center', description: 'Căn chỉnh: left, center, right, justify' },
];
var appStepperProps = [
    { name: 'modelValue', type: 'number', default: '1', description: 'Step hiện tại' },
    { name: 'vertical', type: 'boolean', default: 'false', description: 'Hướng dọc' },
    { name: 'headerNav', type: 'boolean', default: 'false', description: 'Click header để navigate' },
    { name: 'animated', type: 'boolean', default: 'false', description: 'Animation chuyển step' },
];
var appPaginationProps = [
    { name: 'modelValue', type: 'number', default: '1', description: 'Trang hiện tại' },
    { name: 'max', type: 'number', default: 'required', description: 'Tổng số trang' },
    { name: 'directionLinks', type: 'boolean', default: 'false', description: 'Hiện nút prev/next' },
    { name: 'boundaryLinks', type: 'boolean', default: 'false', description: 'Hiện nút first/last' },
];
var appBreadcrumbsProps = [
    { name: 'items', type: 'BreadcrumbItem[]', default: '-', description: 'Danh sách items' },
    { name: 'separator', type: 'string', default: '/', description: 'Ký tự phân cách' },
];
var sidebarItemProps = [
    { name: 'item', type: 'NavItem', default: 'required', description: 'Navigation item object với label, icon, to, children' },
    { name: 'level', type: 'number', default: '0', description: 'Mức lồng nhau cho nested menu' },
];
var pageHeaderProps = [
    { name: 'title', type: 'string', default: '-', description: 'Tiêu đề trang' },
    { name: 'subtitle', type: 'string', default: '-', description: 'Mô tả phụ' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon' },
];
var sectionHeaderProps = [
    { name: 'title', type: 'string', default: '-', description: 'Tiêu đề section' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon' },
];
var appToolbarProps = [
    { name: 'inset', type: 'boolean', default: 'false', description: 'Inset style' },
];
var appSeparatorProps = [
    { name: 'spaced', type: 'boolean', default: 'false', description: 'Có margin' },
    { name: 'vertical', type: 'boolean', default: 'false', description: 'Hướng dọc' },
    { name: 'color', type: 'string', default: '-', description: 'Màu' },
];
var appSpaceProps = [];
var appDrawerProps = [
    { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
    { name: 'side', type: 'string', default: 'left', description: 'Vị trí: left, right' },
    { name: 'width', type: 'number', default: '300', description: 'Chiều rộng' },
    { name: 'mini', type: 'boolean', default: 'false', description: 'Chế độ mini' },
];
var appCardProps = [
    { name: 'flat', type: 'boolean', default: 'false', description: 'Không có shadow' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Có viền' },
    { name: 'square', type: 'boolean', default: 'false', description: 'Góc vuông' },
];
var infoCardProps = [
    { name: 'title', type: 'string', default: '-', description: 'Tiêu đề' },
    { name: 'subtitle', type: 'string', default: '-', description: 'Mô tả' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon' },
    { name: 'iconColor', type: 'string', default: 'primary', description: 'Màu icon' },
];
var statCardProps = [
    { name: 'label', type: 'string', default: 'required', description: 'Nhãn thống kê' },
    { name: 'value', type: 'string | number', default: 'required', description: 'Giá trị' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon' },
    { name: 'trend', type: 'string', default: '-', description: 'Xu hướng (vd: +5%)' },
    { name: 'trendPositive', type: 'boolean', default: 'true', description: 'Trend tích cực' },
];
var appChipProps = [
    { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
    { name: 'icon', type: 'string', default: '-', description: 'Icon' },
    { name: 'color', type: 'Color', default: '-', description: 'Màu nền' },
    { name: 'removable', type: 'boolean', default: 'false', description: 'Có thể xóa' },
    { name: 'outline', type: 'boolean', default: 'false', description: 'Kiểu viền' },
    { name: 'clickable', type: 'boolean', default: 'false', description: 'Có thể click' },
];
var appBadgeProps = [
    { name: 'label', type: 'string | number', default: '-', description: 'Nội dung badge' },
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu nền' },
    { name: 'floating', type: 'boolean', default: 'false', description: 'Vị trí floating' },
    { name: 'rounded', type: 'boolean', default: 'false', description: 'Bo góc' },
];
var appListProps = [
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Có viền' },
    { name: 'separator', type: 'boolean', default: 'false', description: 'Có đường phân cách' },
    { name: 'dense', type: 'boolean', default: 'false', description: 'Compact' },
];
var listItemProps = [
    { name: 'clickable', type: 'boolean', default: 'false', description: 'Có thể click' },
    { name: 'active', type: 'boolean', default: 'false', description: 'Trạng thái active' },
    { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
    { name: 'to', type: 'string', default: '-', description: 'Route path' },
];
var appImageProps = [
    { name: 'src', type: 'string', default: 'required', description: 'URL hình ảnh' },
    { name: 'alt', type: 'string', default: '-', description: 'Alt text' },
    { name: 'ratio', type: 'number', default: '-', description: 'Tỷ lệ width/height' },
    { name: 'fit', type: 'string', default: 'cover', description: 'Object fit' },
];
var appVideoProps = [
    { name: 'src', type: 'string', default: 'required', description: 'URL video' },
    { name: 'ratio', type: 'number', default: '16/9', description: 'Tỷ lệ' },
];
var appCarouselProps = [
    { name: 'modelValue', type: 'number', default: '0', description: 'Slide hiện tại' },
    { name: 'animated', type: 'boolean', default: 'false', description: 'Animation' },
    { name: 'autoplay', type: 'boolean | number', default: 'false', description: 'Tự động chuyển' },
    { name: 'arrows', type: 'boolean', default: 'false', description: 'Hiện nút prev/next' },
    { name: 'navigation', type: 'boolean', default: 'false', description: 'Hiện dots' },
    { name: 'infinite', type: 'boolean', default: 'false', description: 'Loop vô hạn' },
];
var appParallaxProps = [
    { name: 'src', type: 'string', default: 'required', description: 'URL hình nền' },
    { name: 'height', type: 'number', default: '500', description: 'Chiều cao' },
    { name: 'speed', type: 'number', default: '1', description: 'Tốc độ parallax' },
];
var datePickerProps = [
    { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị ngày (DD/MM/YYYY)' },
    { name: 'mask', type: 'string', default: 'DD/MM/YYYY', description: 'Format ngày' },
    { name: 'todayBtn', type: 'boolean', default: 'true', description: 'Hiện nút Hôm nay' },
    { name: 'minimal', type: 'boolean', default: 'false', description: 'Chế độ minimal' },
];
var timePickerProps = [
    { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị giờ (HH:mm)' },
    { name: 'mask', type: 'string', default: 'HH:mm', description: 'Format giờ' },
    { name: 'format24h', type: 'boolean', default: 'true', description: 'Định dạng 24 giờ' },
    { name: 'nowBtn', type: 'boolean', default: 'true', description: 'Hiện nút Bây giờ' },
];
var colorPickerProps = [
    { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị màu (hex)' },
    { name: 'defaultValue', type: 'string', default: '#000000', description: 'Màu mặc định' },
];
var filePickerProps = [
    { name: 'modelValue', type: 'File | File[]', default: '-', description: 'File đã chọn' },
    { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
    { name: 'accept', type: 'string', default: '-', description: 'MIME types cho phép' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Cho phép nhiều file' },
];
var appEditorProps = [
    { name: 'modelValue', type: 'string', default: '-', description: 'Nội dung HTML' },
    { name: 'minHeight', type: 'string', default: '10rem', description: 'Chiều cao tối thiểu' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Chỉ đọc' },
];
var scrollAreaProps = [
    { name: 'thumbStyle', type: 'object', default: '-', description: 'Style thanh cuộn' },
    { name: 'barStyle', type: 'object', default: '-', description: 'Style bar' },
    { name: 'delay', type: 'number', default: '1000', description: 'Delay ẩn thanh cuộn' },
];
var virtualScrollProps = [
    { name: 'items', type: 'Array', default: 'required', description: 'Danh sách items' },
    { name: 'virtualScrollItemSize', type: 'number', default: '24', description: 'Chiều cao mỗi item' },
    { name: 'virtualScrollSliceSize', type: 'number', default: '30', description: 'Số items render mỗi lần' },
];
var infiniteScrollProps = [
    { name: 'offset', type: 'number', default: '500', description: 'Khoảng cách trigger' },
    { name: 'debounce', type: 'number', default: '100', description: 'Debounce delay' },
    { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
];
var timelineProps = [
    { name: 'color', type: 'Color', default: 'primary', description: 'Màu đường timeline' },
    { name: 'layout', type: 'string', default: 'dense', description: 'Layout: dense, comfortable, loose' },
    { name: 'side', type: 'string', default: 'right', description: 'Vị trí nội dung' },
];
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-lg" }));
/** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ name: "widgets", size: "32px", color: "primary" }, { class: "q-mr-sm" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ name: "widgets", size: "32px", color: "primary" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h4 text-weight-bold q-my-none" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
var __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5(__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true, noCaps: true })));
var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true, noCaps: true })], __VLS_functionalComponentArgsRest(__VLS_6), false));
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
var __VLS_10 = __VLS_8.slots.default;
for (var _i = 0, _g = __VLS_vFor((__VLS_ctx.tabs)); _i < _g.length; _i++) {
    var tab = _g[_i][0];
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        key: (tab.name),
        name: (tab.name),
        icon: (tab.icon),
        label: (tab.label),
    }));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
            key: (tab.name),
            name: (tab.name),
            icon: (tab.icon),
            label: (tab.label),
        }], __VLS_functionalComponentArgsRest(__VLS_12), false));
    // @ts-ignore
    [activeTab, tabs,];
}
// @ts-ignore
[];
var __VLS_8;
var __VLS_16;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_17), false));
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ modelValue: (__VLS_ctx.activeTab), animated: true }, { class: "q-mt-md" })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.activeTab), animated: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_26 = __VLS_24.slots.default;
var __VLS_27;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
    name: "buttons",
}));
var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{
        name: "buttons",
    }], __VLS_functionalComponentArgsRest(__VLS_28), false));
var __VLS_32 = __VLS_30.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_33 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
    name: "AppButton",
    description: "Standardized button wrapping q-btn with Vietnamese defaults",
    props: (__VLS_ctx.appButtonProps),
}));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{
        name: "AppButton",
        description: "Standardized button wrapping q-btn with Vietnamese defaults",
        props: (__VLS_ctx.appButtonProps),
    }], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38 = __VLS_36.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-wrap q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_39 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    variant: "filled",
    label: "Filled",
}));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{
        variant: "filled",
        label: "Filled",
    }], __VLS_functionalComponentArgsRest(__VLS_40), false));
var __VLS_44 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
    variant: "outlined",
    label: "Outlined",
}));
var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{
        variant: "outlined",
        label: "Outlined",
    }], __VLS_functionalComponentArgsRest(__VLS_45), false));
var __VLS_49 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
    variant: "flat",
    label: "Flat",
}));
var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{
        variant: "flat",
        label: "Flat",
    }], __VLS_functionalComponentArgsRest(__VLS_50), false));
var __VLS_54 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
    variant: "text",
    label: "Text",
}));
var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{
        variant: "text",
        label: "Text",
    }], __VLS_functionalComponentArgsRest(__VLS_55), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-wrap q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_59 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({
    color: "primary",
    label: "Primary",
}));
var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{
        color: "primary",
        label: "Primary",
    }], __VLS_functionalComponentArgsRest(__VLS_60), false));
var __VLS_64 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
    color: "secondary",
    label: "Secondary",
}));
var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
        color: "secondary",
        label: "Secondary",
    }], __VLS_functionalComponentArgsRest(__VLS_65), false));
var __VLS_69 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
    color: "positive",
    label: "Positive",
}));
var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
        color: "positive",
        label: "Positive",
    }], __VLS_functionalComponentArgsRest(__VLS_70), false));
var __VLS_74 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
    color: "negative",
    label: "Negative",
}));
var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{
        color: "negative",
        label: "Negative",
    }], __VLS_functionalComponentArgsRest(__VLS_75), false));
var __VLS_79 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
    color: "warning",
    label: "Warning",
}));
var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
        color: "warning",
        label: "Warning",
    }], __VLS_functionalComponentArgsRest(__VLS_80), false));
var __VLS_84 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
    color: "info",
    label: "Info",
}));
var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
        color: "info",
        label: "Info",
    }], __VLS_functionalComponentArgsRest(__VLS_85), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-wrap q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_89 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
    label: "Loading",
    loading: true,
}));
var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
        label: "Loading",
        loading: true,
    }], __VLS_functionalComponentArgsRest(__VLS_90), false));
var __VLS_94 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
    label: "Disabled",
    disable: true,
}));
var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
        label: "Disabled",
        disable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_95), false));
var __VLS_99 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
    icon: "add",
    label: "With Icon",
}));
var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
        icon: "add",
        label: "With Icon",
    }], __VLS_functionalComponentArgsRest(__VLS_100), false));
var __VLS_104 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
    icon: "save",
    round: true,
}));
var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
        icon: "save",
        round: true,
    }], __VLS_functionalComponentArgsRest(__VLS_105), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-wrap items-center q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_109 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
    size: "xs",
    label: "XS",
}));
var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([{
        size: "xs",
        label: "XS",
    }], __VLS_functionalComponentArgsRest(__VLS_110), false));
var __VLS_114 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
    size: "sm",
    label: "SM",
}));
var __VLS_116 = __VLS_115.apply(void 0, __spreadArray([{
        size: "sm",
        label: "SM",
    }], __VLS_functionalComponentArgsRest(__VLS_115), false));
var __VLS_119 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
    size: "md",
    label: "MD",
}));
var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
        size: "md",
        label: "MD",
    }], __VLS_functionalComponentArgsRest(__VLS_120), false));
var __VLS_124 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
    size: "lg",
    label: "LG",
}));
var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([{
        size: "lg",
        label: "LG",
    }], __VLS_functionalComponentArgsRest(__VLS_125), false));
var __VLS_129 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
    size: "xl",
    label: "XL",
}));
var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([{
        size: "xl",
        label: "XL",
    }], __VLS_functionalComponentArgsRest(__VLS_130), false));
// @ts-ignore
[activeTab, appButtonProps,];
var __VLS_36;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_134 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
    name: "IconButton",
    description: "Round icon button for actions",
    props: (__VLS_ctx.iconButtonProps),
}));
var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([{
        name: "IconButton",
        description: "Round icon button for actions",
        props: (__VLS_ctx.iconButtonProps),
    }], __VLS_functionalComponentArgsRest(__VLS_135), false));
var __VLS_139 = __VLS_137.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-wrap q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_140 = IconButton_vue_1.default;
// @ts-ignore
var __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
    icon: "edit",
}));
var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([{
        icon: "edit",
    }], __VLS_functionalComponentArgsRest(__VLS_141), false));
var __VLS_145 = IconButton_vue_1.default;
// @ts-ignore
var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145({
    icon: "delete",
    color: "negative",
}));
var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([{
        icon: "delete",
        color: "negative",
    }], __VLS_functionalComponentArgsRest(__VLS_146), false));
var __VLS_150 = IconButton_vue_1.default;
// @ts-ignore
var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
    icon: "visibility",
    color: "info",
}));
var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{
        icon: "visibility",
        color: "info",
    }], __VLS_functionalComponentArgsRest(__VLS_151), false));
var __VLS_155 = IconButton_vue_1.default;
// @ts-ignore
var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
    icon: "favorite",
    color: "pink",
}));
var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([{
        icon: "favorite",
        color: "pink",
    }], __VLS_functionalComponentArgsRest(__VLS_156), false));
var __VLS_160 = IconButton_vue_1.default;
// @ts-ignore
var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
    icon: "share",
    color: "positive",
}));
var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{
        icon: "share",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_161), false));
var __VLS_165 = IconButton_vue_1.default;
// @ts-ignore
var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
    icon: "settings",
    loading: true,
}));
var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([{
        icon: "settings",
        loading: true,
    }], __VLS_functionalComponentArgsRest(__VLS_166), false));
// @ts-ignore
[iconButtonProps,];
var __VLS_137;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_170 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
    name: "ButtonGroup",
    description: "Group of buttons as a unit",
    props: (__VLS_ctx.buttonGroupProps),
}));
var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([{
        name: "ButtonGroup",
        description: "Group of buttons as a unit",
        props: (__VLS_ctx.buttonGroupProps),
    }], __VLS_functionalComponentArgsRest(__VLS_171), false));
var __VLS_175 = __VLS_173.slots.default;
var __VLS_176 = ButtonGroup_vue_1.default || ButtonGroup_vue_1.default;
// @ts-ignore
var __VLS_177 = __VLS_asFunctionalComponent1(__VLS_176, new __VLS_176({
    outline: true,
}));
var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([{
        outline: true,
    }], __VLS_functionalComponentArgsRest(__VLS_177), false));
var __VLS_181 = __VLS_179.slots.default;
var __VLS_182 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182({
    variant: "outlined",
    icon: "format_bold",
}));
var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([{
        variant: "outlined",
        icon: "format_bold",
    }], __VLS_functionalComponentArgsRest(__VLS_183), false));
var __VLS_187 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187({
    variant: "outlined",
    icon: "format_italic",
}));
var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([{
        variant: "outlined",
        icon: "format_italic",
    }], __VLS_functionalComponentArgsRest(__VLS_188), false));
var __VLS_192 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({
    variant: "outlined",
    icon: "format_underlined",
}));
var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{
        variant: "outlined",
        icon: "format_underlined",
    }], __VLS_functionalComponentArgsRest(__VLS_193), false));
// @ts-ignore
[buttonGroupProps,];
var __VLS_179;
// @ts-ignore
[];
var __VLS_173;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_197 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({
    name: "ButtonToggle",
    description: "Toggle button group for selection",
    props: (__VLS_ctx.buttonToggleProps),
}));
var __VLS_199 = __VLS_198.apply(void 0, __spreadArray([{
        name: "ButtonToggle",
        description: "Toggle button group for selection",
        props: (__VLS_ctx.buttonToggleProps),
    }], __VLS_functionalComponentArgsRest(__VLS_198), false));
var __VLS_202 = __VLS_200.slots.default;
var __VLS_203 = ButtonToggle_vue_1.default;
// @ts-ignore
var __VLS_204 = __VLS_asFunctionalComponent1(__VLS_203, new __VLS_203({
    modelValue: (__VLS_ctx.toggleValue),
    options: ([
        { label: 'Trái', value: 'left', icon: 'format_align_left' },
        { label: 'Giữa', value: 'center', icon: 'format_align_center' },
        { label: 'Phải', value: 'right', icon: 'format_align_right' }
    ]),
}));
var __VLS_205 = __VLS_204.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.toggleValue),
        options: ([
            { label: 'Trái', value: 'left', icon: 'format_align_left' },
            { label: 'Giữa', value: 'center', icon: 'format_align_center' },
            { label: 'Phải', value: 'right', icon: 'format_align_right' }
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_204), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
(__VLS_ctx.toggleValue);
// @ts-ignore
[buttonToggleProps, toggleValue, toggleValue,];
var __VLS_200;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_208 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208({
    name: "ButtonDropdown",
    description: "Button with dropdown menu",
    props: (__VLS_ctx.buttonDropdownProps),
}));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([{
        name: "ButtonDropdown",
        description: "Button with dropdown menu",
        props: (__VLS_ctx.buttonDropdownProps),
    }], __VLS_functionalComponentArgsRest(__VLS_209), false));
var __VLS_213 = __VLS_211.slots.default;
var __VLS_214 = ButtonDropdown_vue_1.default || ButtonDropdown_vue_1.default;
// @ts-ignore
var __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214({
    label: "Tùy chọn",
    icon: "arrow_drop_down",
}));
var __VLS_216 = __VLS_215.apply(void 0, __spreadArray([{
        label: "Tùy chọn",
        icon: "arrow_drop_down",
    }], __VLS_functionalComponentArgsRest(__VLS_215), false));
var __VLS_219 = __VLS_217.slots.default;
var __VLS_220;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220({}));
var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_221), false));
var __VLS_225 = __VLS_223.slots.default;
var __VLS_226;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_227 = __VLS_asFunctionalComponent1(__VLS_226, new __VLS_226(__assign({ 'onClick': {} }, { clickable: true })));
var __VLS_228 = __VLS_227.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: true })], __VLS_functionalComponentArgsRest(__VLS_227), false));
var __VLS_231;
var __VLS_232 = ({ click: {} },
    { onClick: (function () { }) });
var __VLS_233 = __VLS_229.slots.default;
var __VLS_234;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_235 = __VLS_asFunctionalComponent1(__VLS_234, new __VLS_234({
    avatar: true,
}));
var __VLS_236 = __VLS_235.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_235), false));
var __VLS_239 = __VLS_237.slots.default;
var __VLS_240;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240({
    name: "edit",
}));
var __VLS_242 = __VLS_241.apply(void 0, __spreadArray([{
        name: "edit",
    }], __VLS_functionalComponentArgsRest(__VLS_241), false));
// @ts-ignore
[buttonDropdownProps,];
var __VLS_237;
var __VLS_245;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_246 = __VLS_asFunctionalComponent1(__VLS_245, new __VLS_245({}));
var __VLS_247 = __VLS_246.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_246), false));
var __VLS_250 = __VLS_248.slots.default;
// @ts-ignore
[];
var __VLS_248;
// @ts-ignore
[];
var __VLS_229;
var __VLS_230;
var __VLS_251;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251(__assign({ 'onClick': {} }, { clickable: true })));
var __VLS_253 = __VLS_252.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: true })], __VLS_functionalComponentArgsRest(__VLS_252), false));
var __VLS_256;
var __VLS_257 = ({ click: {} },
    { onClick: (function () { }) });
var __VLS_258 = __VLS_254.slots.default;
var __VLS_259;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_260 = __VLS_asFunctionalComponent1(__VLS_259, new __VLS_259({
    avatar: true,
}));
var __VLS_261 = __VLS_260.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_260), false));
var __VLS_264 = __VLS_262.slots.default;
var __VLS_265;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_266 = __VLS_asFunctionalComponent1(__VLS_265, new __VLS_265({
    name: "delete",
}));
var __VLS_267 = __VLS_266.apply(void 0, __spreadArray([{
        name: "delete",
    }], __VLS_functionalComponentArgsRest(__VLS_266), false));
// @ts-ignore
[];
var __VLS_262;
var __VLS_270;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270({}));
var __VLS_272 = __VLS_271.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_271), false));
var __VLS_275 = __VLS_273.slots.default;
// @ts-ignore
[];
var __VLS_273;
// @ts-ignore
[];
var __VLS_254;
var __VLS_255;
// @ts-ignore
[];
var __VLS_223;
// @ts-ignore
[];
var __VLS_217;
// @ts-ignore
[];
var __VLS_211;
// @ts-ignore
[];
var __VLS_30;
var __VLS_276;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_277 = __VLS_asFunctionalComponent1(__VLS_276, new __VLS_276({
    name: "inputs",
}));
var __VLS_278 = __VLS_277.apply(void 0, __spreadArray([{
        name: "inputs",
    }], __VLS_functionalComponentArgsRest(__VLS_277), false));
var __VLS_281 = __VLS_279.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_282 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_283 = __VLS_asFunctionalComponent1(__VLS_282, new __VLS_282({
    name: "AppInput",
    description: "Input wrapper with Vietnamese defaults and validation",
    props: (__VLS_ctx.appInputProps),
}));
var __VLS_284 = __VLS_283.apply(void 0, __spreadArray([{
        name: "AppInput",
        description: "Input wrapper with Vietnamese defaults and validation",
        props: (__VLS_ctx.appInputProps),
    }], __VLS_functionalComponentArgsRest(__VLS_283), false));
var __VLS_287 = __VLS_285.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_288 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_289 = __VLS_asFunctionalComponent1(__VLS_288, new __VLS_288({
    modelValue: (__VLS_ctx.inputValue),
    label: "Họ và tên",
    placeholder: "Nhập họ tên...",
    prependIcon: "person",
    clearable: true,
}));
var __VLS_290 = __VLS_289.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.inputValue),
        label: "Họ và tên",
        placeholder: "Nhập họ tên...",
        prependIcon: "person",
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_289), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_293 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_294 = __VLS_asFunctionalComponent1(__VLS_293, new __VLS_293({
    label: "Email",
    type: "email",
    prependIcon: "email",
    hint: "example@domain.com",
}));
var __VLS_295 = __VLS_294.apply(void 0, __spreadArray([{
        label: "Email",
        type: "email",
        prependIcon: "email",
        hint: "example@domain.com",
    }], __VLS_functionalComponentArgsRest(__VLS_294), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_298 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_299 = __VLS_asFunctionalComponent1(__VLS_298, new __VLS_298({
    label: "Mật khẩu",
    type: "password",
    prependIcon: "lock",
    required: true,
}));
var __VLS_300 = __VLS_299.apply(void 0, __spreadArray([{
        label: "Mật khẩu",
        type: "password",
        prependIcon: "lock",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_299), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_303 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_304 = __VLS_asFunctionalComponent1(__VLS_303, new __VLS_303({
    label: "Số điện thoại",
    mask: "#### ### ###",
    prependIcon: "phone",
}));
var __VLS_305 = __VLS_304.apply(void 0, __spreadArray([{
        label: "Số điện thoại",
        mask: "#### ### ###",
        prependIcon: "phone",
    }], __VLS_functionalComponentArgsRest(__VLS_304), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_308 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_309 = __VLS_asFunctionalComponent1(__VLS_308, new __VLS_308({
    label: "Filled Style",
    filled: true,
    outlined: (false),
}));
var __VLS_310 = __VLS_309.apply(void 0, __spreadArray([{
        label: "Filled Style",
        filled: true,
        outlined: (false),
    }], __VLS_functionalComponentArgsRest(__VLS_309), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_313 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_314 = __VLS_asFunctionalComponent1(__VLS_313, new __VLS_313({
    label: "With Error",
    errorMessage: "Trường này không hợp lệ",
}));
var __VLS_315 = __VLS_314.apply(void 0, __spreadArray([{
        label: "With Error",
        errorMessage: "Trường này không hợp lệ",
    }], __VLS_functionalComponentArgsRest(__VLS_314), false));
// @ts-ignore
[appInputProps, inputValue,];
var __VLS_285;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_318 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_319 = __VLS_asFunctionalComponent1(__VLS_318, new __VLS_318({
    name: "AppSelect",
    description: "Select dropdown with search and multiple selection",
    props: (__VLS_ctx.appSelectProps),
}));
var __VLS_320 = __VLS_319.apply(void 0, __spreadArray([{
        name: "AppSelect",
        description: "Select dropdown with search and multiple selection",
        props: (__VLS_ctx.appSelectProps),
    }], __VLS_functionalComponentArgsRest(__VLS_319), false));
var __VLS_323 = __VLS_321.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_324 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_325 = __VLS_asFunctionalComponent1(__VLS_324, new __VLS_324({
    modelValue: (__VLS_ctx.selectValue),
    label: "Thành phố",
    options: (['Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ']),
}));
var __VLS_326 = __VLS_325.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.selectValue),
        label: "Thành phố",
        options: (['Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ']),
    }], __VLS_functionalComponentArgsRest(__VLS_325), false));
var __VLS_329 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_330 = __VLS_asFunctionalComponent1(__VLS_329, new __VLS_329({
    modelValue: (__VLS_ctx.multiSelectValue),
    label: "Kỹ năng",
    options: (['Vue', 'React', 'Angular', 'TypeScript', 'Node.js']),
    multiple: true,
    useChips: true,
}));
var __VLS_331 = __VLS_330.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.multiSelectValue),
        label: "Kỹ năng",
        options: (['Vue', 'React', 'Angular', 'TypeScript', 'Node.js']),
        multiple: true,
        useChips: true,
    }], __VLS_functionalComponentArgsRest(__VLS_330), false));
// @ts-ignore
[appSelectProps, selectValue, multiSelectValue,];
var __VLS_321;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_334 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_335 = __VLS_asFunctionalComponent1(__VLS_334, new __VLS_334({
    name: "AppTextarea",
    description: "Multiline text input with autogrow",
    props: (__VLS_ctx.appTextareaProps),
}));
var __VLS_336 = __VLS_335.apply(void 0, __spreadArray([{
        name: "AppTextarea",
        description: "Multiline text input with autogrow",
        props: (__VLS_ctx.appTextareaProps),
    }], __VLS_functionalComponentArgsRest(__VLS_335), false));
var __VLS_339 = __VLS_337.slots.default;
var __VLS_340 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_341 = __VLS_asFunctionalComponent1(__VLS_340, new __VLS_340({
    modelValue: (__VLS_ctx.textareaValue),
    label: "Mô tả",
    placeholder: "Nhập mô tả chi tiết...",
    autogrow: true,
    counter: true,
    maxlength: (500),
}));
var __VLS_342 = __VLS_341.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.textareaValue),
        label: "Mô tả",
        placeholder: "Nhập mô tả chi tiết...",
        autogrow: true,
        counter: true,
        maxlength: (500),
    }], __VLS_functionalComponentArgsRest(__VLS_341), false));
// @ts-ignore
[appTextareaProps, textareaValue,];
var __VLS_337;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_345 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_346 = __VLS_asFunctionalComponent1(__VLS_345, new __VLS_345({
    name: "AppCheckbox",
    description: "Checkbox input with label",
    props: (__VLS_ctx.appCheckboxProps),
}));
var __VLS_347 = __VLS_346.apply(void 0, __spreadArray([{
        name: "AppCheckbox",
        description: "Checkbox input with label",
        props: (__VLS_ctx.appCheckboxProps),
    }], __VLS_functionalComponentArgsRest(__VLS_346), false));
var __VLS_350 = __VLS_348.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_351 = AppCheckbox_vue_1.default;
// @ts-ignore
var __VLS_352 = __VLS_asFunctionalComponent1(__VLS_351, new __VLS_351({
    modelValue: (__VLS_ctx.checkbox1),
    label: "Đồng ý điều khoản",
}));
var __VLS_353 = __VLS_352.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.checkbox1),
        label: "Đồng ý điều khoản",
    }], __VLS_functionalComponentArgsRest(__VLS_352), false));
var __VLS_356 = AppCheckbox_vue_1.default;
// @ts-ignore
var __VLS_357 = __VLS_asFunctionalComponent1(__VLS_356, new __VLS_356({
    modelValue: (__VLS_ctx.checkbox2),
    label: "Nhận thông báo",
    color: "positive",
}));
var __VLS_358 = __VLS_357.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.checkbox2),
        label: "Nhận thông báo",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_357), false));
var __VLS_361 = AppCheckbox_vue_1.default;
// @ts-ignore
var __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361({
    label: "Disabled",
    disable: true,
}));
var __VLS_363 = __VLS_362.apply(void 0, __spreadArray([{
        label: "Disabled",
        disable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_362), false));
// @ts-ignore
[appCheckboxProps, checkbox1, checkbox2,];
var __VLS_348;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_366 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_367 = __VLS_asFunctionalComponent1(__VLS_366, new __VLS_366({
    name: "AppToggle",
    description: "Toggle switch input",
    props: (__VLS_ctx.appToggleProps),
}));
var __VLS_368 = __VLS_367.apply(void 0, __spreadArray([{
        name: "AppToggle",
        description: "Toggle switch input",
        props: (__VLS_ctx.appToggleProps),
    }], __VLS_functionalComponentArgsRest(__VLS_367), false));
var __VLS_371 = __VLS_369.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_372 = AppToggle_vue_1.default;
// @ts-ignore
var __VLS_373 = __VLS_asFunctionalComponent1(__VLS_372, new __VLS_372({
    modelValue: (__VLS_ctx.toggle1),
    label: "Chế độ tối",
}));
var __VLS_374 = __VLS_373.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.toggle1),
        label: "Chế độ tối",
    }], __VLS_functionalComponentArgsRest(__VLS_373), false));
var __VLS_377 = AppToggle_vue_1.default;
// @ts-ignore
var __VLS_378 = __VLS_asFunctionalComponent1(__VLS_377, new __VLS_377({
    modelValue: (__VLS_ctx.toggle2),
    label: "Thông báo",
    color: "positive",
}));
var __VLS_379 = __VLS_378.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.toggle2),
        label: "Thông báo",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_378), false));
var __VLS_382 = AppToggle_vue_1.default;
// @ts-ignore
var __VLS_383 = __VLS_asFunctionalComponent1(__VLS_382, new __VLS_382({
    label: "Disabled",
    disable: true,
}));
var __VLS_384 = __VLS_383.apply(void 0, __spreadArray([{
        label: "Disabled",
        disable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_383), false));
// @ts-ignore
[appToggleProps, toggle1, toggle2,];
var __VLS_369;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_387 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_388 = __VLS_asFunctionalComponent1(__VLS_387, new __VLS_387({
    name: "AppSlider",
    description: "Single value slider",
    props: (__VLS_ctx.appSliderProps),
}));
var __VLS_389 = __VLS_388.apply(void 0, __spreadArray([{
        name: "AppSlider",
        description: "Single value slider",
        props: (__VLS_ctx.appSliderProps),
    }], __VLS_functionalComponentArgsRest(__VLS_388), false));
var __VLS_392 = __VLS_390.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-px-md" }));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
(__VLS_ctx.sliderValue);
var __VLS_393 = AppSlider_vue_1.default;
// @ts-ignore
var __VLS_394 = __VLS_asFunctionalComponent1(__VLS_393, new __VLS_393({
    modelValue: (__VLS_ctx.sliderValue),
    min: (0),
    max: (100),
    label: true,
    color: "primary",
}));
var __VLS_395 = __VLS_394.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.sliderValue),
        min: (0),
        max: (100),
        label: true,
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_394), false));
// @ts-ignore
[appSliderProps, sliderValue, sliderValue,];
var __VLS_390;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_398 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_399 = __VLS_asFunctionalComponent1(__VLS_398, new __VLS_398({
    name: "AppRange",
    description: "Range slider with min/max values",
    props: (__VLS_ctx.appRangeProps),
}));
var __VLS_400 = __VLS_399.apply(void 0, __spreadArray([{
        name: "AppRange",
        description: "Range slider with min/max values",
        props: (__VLS_ctx.appRangeProps),
    }], __VLS_functionalComponentArgsRest(__VLS_399), false));
var __VLS_403 = __VLS_401.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-px-md" }));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
((_b = (_a = __VLS_ctx.rangeValue) === null || _a === void 0 ? void 0 : _a.min) !== null && _b !== void 0 ? _b : 0);
((_d = (_c = __VLS_ctx.rangeValue) === null || _c === void 0 ? void 0 : _c.max) !== null && _d !== void 0 ? _d : 100);
var __VLS_404 = AppRange_vue_1.default;
// @ts-ignore
var __VLS_405 = __VLS_asFunctionalComponent1(__VLS_404, new __VLS_404({
    modelValue: (__VLS_ctx.rangeValue),
    min: (0),
    max: (100),
    label: true,
    color: "positive",
}));
var __VLS_406 = __VLS_405.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.rangeValue),
        min: (0),
        max: (100),
        label: true,
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_405), false));
// @ts-ignore
[appRangeProps, rangeValue, rangeValue, rangeValue,];
var __VLS_401;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_409 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_410 = __VLS_asFunctionalComponent1(__VLS_409, new __VLS_409({
    name: "SearchInput",
    description: "Search input with debounce",
    props: (__VLS_ctx.searchInputProps),
}));
var __VLS_411 = __VLS_410.apply(void 0, __spreadArray([{
        name: "SearchInput",
        description: "Search input with debounce",
        props: (__VLS_ctx.searchInputProps),
    }], __VLS_functionalComponentArgsRest(__VLS_410), false));
var __VLS_414 = __VLS_412.slots.default;
var __VLS_415 = SearchInput_vue_1.default;
// @ts-ignore
var __VLS_416 = __VLS_asFunctionalComponent1(__VLS_415, new __VLS_415({
    modelValue: (__VLS_ctx.searchValue),
    placeholder: "Tìm kiếm...",
    debounce: (300),
    clearable: true,
}));
var __VLS_417 = __VLS_416.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.searchValue),
        placeholder: "Tìm kiếm...",
        debounce: (300),
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_416), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
(__VLS_ctx.searchValue);
// @ts-ignore
[searchInputProps, searchValue, searchValue,];
var __VLS_412;
// @ts-ignore
[];
var __VLS_279;
var __VLS_420;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_421 = __VLS_asFunctionalComponent1(__VLS_420, new __VLS_420({
    name: "dialogs",
}));
var __VLS_422 = __VLS_421.apply(void 0, __spreadArray([{
        name: "dialogs",
    }], __VLS_functionalComponentArgsRest(__VLS_421), false));
var __VLS_425 = __VLS_423.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_426 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_427 = __VLS_asFunctionalComponent1(__VLS_426, new __VLS_426({
    name: "AppDialog",
    description: "Base dialog wrapper component",
    props: (__VLS_ctx.appDialogProps),
}));
var __VLS_428 = __VLS_427.apply(void 0, __spreadArray([{
        name: "AppDialog",
        description: "Base dialog wrapper component",
        props: (__VLS_ctx.appDialogProps),
    }], __VLS_functionalComponentArgsRest(__VLS_427), false));
var __VLS_431 = __VLS_429.slots.default;
var __VLS_432 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_433 = __VLS_asFunctionalComponent1(__VLS_432, new __VLS_432(__assign({ 'onClick': {} }, { label: "Mở Dialog" })));
var __VLS_434 = __VLS_433.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Mở Dialog" })], __VLS_functionalComponentArgsRest(__VLS_433), false));
var __VLS_437;
var __VLS_438 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showAppDialog = true;
            // @ts-ignore
            [appDialogProps, showAppDialog,];
        } });
var __VLS_435;
var __VLS_436;
var __VLS_439 = AppDialog_vue_1.default || AppDialog_vue_1.default;
// @ts-ignore
var __VLS_440 = __VLS_asFunctionalComponent1(__VLS_439, new __VLS_439({
    modelValue: (__VLS_ctx.showAppDialog),
}));
var __VLS_441 = __VLS_440.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showAppDialog),
    }], __VLS_functionalComponentArgsRest(__VLS_440), false));
var __VLS_444 = __VLS_442.slots.default;
var __VLS_445;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_446 = __VLS_asFunctionalComponent1(__VLS_445, new __VLS_445(__assign({ style: {} })));
var __VLS_447 = __VLS_446.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_446), false));
var __VLS_450 = __VLS_448.slots.default;
var __VLS_451;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_452 = __VLS_asFunctionalComponent1(__VLS_451, new __VLS_451({}));
var __VLS_453 = __VLS_452.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_452), false));
var __VLS_456 = __VLS_454.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[showAppDialog,];
var __VLS_454;
var __VLS_457;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_458 = __VLS_asFunctionalComponent1(__VLS_457, new __VLS_457({}));
var __VLS_459 = __VLS_458.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_458), false));
var __VLS_462 = __VLS_460.slots.default;
// @ts-ignore
[];
var __VLS_460;
var __VLS_463;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_464 = __VLS_asFunctionalComponent1(__VLS_463, new __VLS_463({
    align: "right",
}));
var __VLS_465 = __VLS_464.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_464), false));
var __VLS_468 = __VLS_466.slots.default;
var __VLS_469 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_470 = __VLS_asFunctionalComponent1(__VLS_469, new __VLS_469(__assign({ 'onClick': {} }, { variant: "flat", label: "Đóng" })));
var __VLS_471 = __VLS_470.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { variant: "flat", label: "Đóng" })], __VLS_functionalComponentArgsRest(__VLS_470), false));
var __VLS_474;
var __VLS_475 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showAppDialog = false;
            // @ts-ignore
            [showAppDialog,];
        } });
var __VLS_472;
var __VLS_473;
// @ts-ignore
[];
var __VLS_466;
// @ts-ignore
[];
var __VLS_448;
// @ts-ignore
[];
var __VLS_442;
// @ts-ignore
[];
var __VLS_429;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_476 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_477 = __VLS_asFunctionalComponent1(__VLS_476, new __VLS_476({
    name: "FormDialog",
    description: "Dialog with form functionality",
    props: (__VLS_ctx.formDialogProps),
}));
var __VLS_478 = __VLS_477.apply(void 0, __spreadArray([{
        name: "FormDialog",
        description: "Dialog with form functionality",
        props: (__VLS_ctx.formDialogProps),
    }], __VLS_functionalComponentArgsRest(__VLS_477), false));
var __VLS_481 = __VLS_479.slots.default;
var __VLS_482 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_483 = __VLS_asFunctionalComponent1(__VLS_482, new __VLS_482(__assign({ 'onClick': {} }, { label: "Mở Form Dialog" })));
var __VLS_484 = __VLS_483.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Mở Form Dialog" })], __VLS_functionalComponentArgsRest(__VLS_483), false));
var __VLS_487;
var __VLS_488 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showFormDialog = true;
            // @ts-ignore
            [formDialogProps, showFormDialog,];
        } });
var __VLS_485;
var __VLS_486;
var __VLS_489 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_490 = __VLS_asFunctionalComponent1(__VLS_489, new __VLS_489(__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.showFormDialog), title: "Thêm nhân viên" })));
var __VLS_491 = __VLS_490.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.showFormDialog), title: "Thêm nhân viên" })], __VLS_functionalComponentArgsRest(__VLS_490), false));
var __VLS_494;
var __VLS_495 = ({ submit: {} },
    { onSubmit: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showFormDialog = false;
            // @ts-ignore
            [showFormDialog, showFormDialog,];
        } });
var __VLS_496 = __VLS_492.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_497 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_498 = __VLS_asFunctionalComponent1(__VLS_497, new __VLS_497({
    label: "Họ tên",
    required: true,
}));
var __VLS_499 = __VLS_498.apply(void 0, __spreadArray([{
        label: "Họ tên",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_498), false));
var __VLS_502 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_503 = __VLS_asFunctionalComponent1(__VLS_502, new __VLS_502({
    label: "Email",
    type: "email",
}));
var __VLS_504 = __VLS_503.apply(void 0, __spreadArray([{
        label: "Email",
        type: "email",
    }], __VLS_functionalComponentArgsRest(__VLS_503), false));
var __VLS_507 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_508 = __VLS_asFunctionalComponent1(__VLS_507, new __VLS_507({
    label: "Phòng ban",
    options: (['IT', 'HR', 'Sales']),
}));
var __VLS_509 = __VLS_508.apply(void 0, __spreadArray([{
        label: "Phòng ban",
        options: (['IT', 'HR', 'Sales']),
    }], __VLS_functionalComponentArgsRest(__VLS_508), false));
// @ts-ignore
[];
var __VLS_492;
var __VLS_493;
// @ts-ignore
[];
var __VLS_479;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_512 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_513 = __VLS_asFunctionalComponent1(__VLS_512, new __VLS_512({
    name: "ConfirmDialog",
    description: "Confirmation dialog with actions",
    props: (__VLS_ctx.confirmDialogProps),
}));
var __VLS_514 = __VLS_513.apply(void 0, __spreadArray([{
        name: "ConfirmDialog",
        description: "Confirmation dialog with actions",
        props: (__VLS_ctx.confirmDialogProps),
    }], __VLS_functionalComponentArgsRest(__VLS_513), false));
var __VLS_517 = __VLS_515.slots.default;
var __VLS_518 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_519 = __VLS_asFunctionalComponent1(__VLS_518, new __VLS_518(__assign({ 'onClick': {} }, { label: "Hiện xác nhận", color: "info" })));
var __VLS_520 = __VLS_519.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Hiện xác nhận", color: "info" })], __VLS_functionalComponentArgsRest(__VLS_519), false));
var __VLS_523;
var __VLS_524 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showConfirmDialog = true;
            // @ts-ignore
            [confirmDialogProps, showConfirmDialog,];
        } });
var __VLS_521;
var __VLS_522;
var __VLS_525 = ConfirmDialog_vue_1.default;
// @ts-ignore
var __VLS_526 = __VLS_asFunctionalComponent1(__VLS_525, new __VLS_525(__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showConfirmDialog), message: "Bạn có chắc chắn muốn thực hiện hành động này?" })));
var __VLS_527 = __VLS_526.apply(void 0, __spreadArray([__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showConfirmDialog), message: "Bạn có chắc chắn muốn thực hiện hành động này?" })], __VLS_functionalComponentArgsRest(__VLS_526), false));
var __VLS_530;
var __VLS_531 = ({ confirm: {} },
    { onConfirm: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showConfirmDialog = false;
            // @ts-ignore
            [showConfirmDialog, showConfirmDialog,];
        } });
var __VLS_528;
var __VLS_529;
// @ts-ignore
[];
var __VLS_515;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_532 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_533 = __VLS_asFunctionalComponent1(__VLS_532, new __VLS_532({
    name: "DeleteDialog",
    description: "Delete confirmation dialog",
    props: (__VLS_ctx.deleteDialogProps),
}));
var __VLS_534 = __VLS_533.apply(void 0, __spreadArray([{
        name: "DeleteDialog",
        description: "Delete confirmation dialog",
        props: (__VLS_ctx.deleteDialogProps),
    }], __VLS_functionalComponentArgsRest(__VLS_533), false));
var __VLS_537 = __VLS_535.slots.default;
var __VLS_538 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_539 = __VLS_asFunctionalComponent1(__VLS_538, new __VLS_538(__assign({ 'onClick': {} }, { label: "Xóa", color: "negative" })));
var __VLS_540 = __VLS_539.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xóa", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_539), false));
var __VLS_543;
var __VLS_544 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showDeleteDialog = true;
            // @ts-ignore
            [deleteDialogProps, showDeleteDialog,];
        } });
var __VLS_541;
var __VLS_542;
var __VLS_545 = DeleteDialog_vue_1.default;
// @ts-ignore
var __VLS_546 = __VLS_asFunctionalComponent1(__VLS_545, new __VLS_545(__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showDeleteDialog), itemName: "Nhân viên ABC" })));
var __VLS_547 = __VLS_546.apply(void 0, __spreadArray([__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showDeleteDialog), itemName: "Nhân viên ABC" })], __VLS_functionalComponentArgsRest(__VLS_546), false));
var __VLS_550;
var __VLS_551 = ({ confirm: {} },
    { onConfirm: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showDeleteDialog = false;
            // @ts-ignore
            [showDeleteDialog, showDeleteDialog,];
        } });
var __VLS_548;
var __VLS_549;
// @ts-ignore
[];
var __VLS_535;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_552 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_553 = __VLS_asFunctionalComponent1(__VLS_552, new __VLS_552({
    name: "AppMenu",
    description: "Dropdown context menu",
    props: (__VLS_ctx.appMenuProps),
}));
var __VLS_554 = __VLS_553.apply(void 0, __spreadArray([{
        name: "AppMenu",
        description: "Dropdown context menu",
        props: (__VLS_ctx.appMenuProps),
    }], __VLS_functionalComponentArgsRest(__VLS_553), false));
var __VLS_557 = __VLS_555.slots.default;
var __VLS_558 = AppButton_vue_1.default || AppButton_vue_1.default;
// @ts-ignore
var __VLS_559 = __VLS_asFunctionalComponent1(__VLS_558, new __VLS_558({
    label: "Click để mở menu",
}));
var __VLS_560 = __VLS_559.apply(void 0, __spreadArray([{
        label: "Click để mở menu",
    }], __VLS_functionalComponentArgsRest(__VLS_559), false));
var __VLS_563 = __VLS_561.slots.default;
var __VLS_564 = AppMenu_vue_1.default;
// @ts-ignore
var __VLS_565 = __VLS_asFunctionalComponent1(__VLS_564, new __VLS_564({
    items: ([
        { label: 'Chỉnh sửa', icon: 'edit' },
        { label: 'Sao chép', icon: 'content_copy' },
        { label: '', separator: true },
        { label: 'Xóa', icon: 'delete' }
    ]),
}));
var __VLS_566 = __VLS_565.apply(void 0, __spreadArray([{
        items: ([
            { label: 'Chỉnh sửa', icon: 'edit' },
            { label: 'Sao chép', icon: 'content_copy' },
            { label: '', separator: true },
            { label: 'Xóa', icon: 'delete' }
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_565), false));
// @ts-ignore
[appMenuProps,];
var __VLS_561;
// @ts-ignore
[];
var __VLS_555;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_569 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_570 = __VLS_asFunctionalComponent1(__VLS_569, new __VLS_569({
    name: "AppTooltip",
    description: "Tooltip for hints",
    props: (__VLS_ctx.appTooltipProps),
}));
var __VLS_571 = __VLS_570.apply(void 0, __spreadArray([{
        name: "AppTooltip",
        description: "Tooltip for hints",
        props: (__VLS_ctx.appTooltipProps),
    }], __VLS_functionalComponentArgsRest(__VLS_570), false));
var __VLS_574 = __VLS_572.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_575 = AppButton_vue_1.default || AppButton_vue_1.default;
// @ts-ignore
var __VLS_576 = __VLS_asFunctionalComponent1(__VLS_575, new __VLS_575({
    label: "Hover me",
}));
var __VLS_577 = __VLS_576.apply(void 0, __spreadArray([{
        label: "Hover me",
    }], __VLS_functionalComponentArgsRest(__VLS_576), false));
var __VLS_580 = __VLS_578.slots.default;
var __VLS_581 = AppTooltip_vue_1.default;
// @ts-ignore
var __VLS_582 = __VLS_asFunctionalComponent1(__VLS_581, new __VLS_581({
    text: "Đây là tooltip",
}));
var __VLS_583 = __VLS_582.apply(void 0, __spreadArray([{
        text: "Đây là tooltip",
    }], __VLS_functionalComponentArgsRest(__VLS_582), false));
// @ts-ignore
[appTooltipProps,];
var __VLS_578;
var __VLS_586;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_587 = __VLS_asFunctionalComponent1(__VLS_586, new __VLS_586(__assign({ name: "help", size: "24px" }, { class: "cursor-pointer" })));
var __VLS_588 = __VLS_587.apply(void 0, __spreadArray([__assign({ name: "help", size: "24px" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_587), false));
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
var __VLS_591 = __VLS_589.slots.default;
var __VLS_592 = AppTooltip_vue_1.default;
// @ts-ignore
var __VLS_593 = __VLS_asFunctionalComponent1(__VLS_592, new __VLS_592({
    text: "Thông tin trợ giúp",
}));
var __VLS_594 = __VLS_593.apply(void 0, __spreadArray([{
        text: "Thông tin trợ giúp",
    }], __VLS_functionalComponentArgsRest(__VLS_593), false));
// @ts-ignore
[];
var __VLS_589;
// @ts-ignore
[];
var __VLS_572;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_597 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_598 = __VLS_asFunctionalComponent1(__VLS_597, new __VLS_597({
    name: "PopupEdit",
    description: "Inline popup editor",
    props: (__VLS_ctx.popupEditProps),
}));
var __VLS_599 = __VLS_598.apply(void 0, __spreadArray([{
        name: "PopupEdit",
        description: "Inline popup editor",
        props: (__VLS_ctx.popupEditProps),
    }], __VLS_functionalComponentArgsRest(__VLS_598), false));
var __VLS_602 = __VLS_600.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-primary cursor-pointer" }));
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
(__VLS_ctx.editableText);
var __VLS_603 = PopupEdit_vue_1.default;
// @ts-ignore
var __VLS_604 = __VLS_asFunctionalComponent1(__VLS_603, new __VLS_603({
    modelValue: (__VLS_ctx.editableText),
}));
var __VLS_605 = __VLS_604.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editableText),
    }], __VLS_functionalComponentArgsRest(__VLS_604), false));
// @ts-ignore
[popupEditProps, editableText, editableText,];
var __VLS_600;
// @ts-ignore
[];
var __VLS_423;
var __VLS_608;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_609 = __VLS_asFunctionalComponent1(__VLS_608, new __VLS_608({
    name: "feedback",
}));
var __VLS_610 = __VLS_609.apply(void 0, __spreadArray([{
        name: "feedback",
    }], __VLS_functionalComponentArgsRest(__VLS_609), false));
var __VLS_613 = __VLS_611.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_614 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_615 = __VLS_asFunctionalComponent1(__VLS_614, new __VLS_614({
    name: "AppSpinner",
    description: "Loading spinner indicator",
    props: (__VLS_ctx.appSpinnerProps),
}));
var __VLS_616 = __VLS_615.apply(void 0, __spreadArray([{
        name: "AppSpinner",
        description: "Loading spinner indicator",
        props: (__VLS_ctx.appSpinnerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_615), false));
var __VLS_619 = __VLS_617.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center q-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-lg']} */ ;
var __VLS_620 = AppSpinner_vue_1.default;
// @ts-ignore
var __VLS_621 = __VLS_asFunctionalComponent1(__VLS_620, new __VLS_620({
    size: "xs",
}));
var __VLS_622 = __VLS_621.apply(void 0, __spreadArray([{
        size: "xs",
    }], __VLS_functionalComponentArgsRest(__VLS_621), false));
var __VLS_625 = AppSpinner_vue_1.default;
// @ts-ignore
var __VLS_626 = __VLS_asFunctionalComponent1(__VLS_625, new __VLS_625({
    size: "sm",
}));
var __VLS_627 = __VLS_626.apply(void 0, __spreadArray([{
        size: "sm",
    }], __VLS_functionalComponentArgsRest(__VLS_626), false));
var __VLS_630 = AppSpinner_vue_1.default;
// @ts-ignore
var __VLS_631 = __VLS_asFunctionalComponent1(__VLS_630, new __VLS_630({
    size: "md",
}));
var __VLS_632 = __VLS_631.apply(void 0, __spreadArray([{
        size: "md",
    }], __VLS_functionalComponentArgsRest(__VLS_631), false));
var __VLS_635 = AppSpinner_vue_1.default;
// @ts-ignore
var __VLS_636 = __VLS_asFunctionalComponent1(__VLS_635, new __VLS_635({
    size: "lg",
    color: "positive",
}));
var __VLS_637 = __VLS_636.apply(void 0, __spreadArray([{
        size: "lg",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_636), false));
var __VLS_640 = AppSpinner_vue_1.default;
// @ts-ignore
var __VLS_641 = __VLS_asFunctionalComponent1(__VLS_640, new __VLS_640({
    size: "xl",
    color: "negative",
}));
var __VLS_642 = __VLS_641.apply(void 0, __spreadArray([{
        size: "xl",
        color: "negative",
    }], __VLS_functionalComponentArgsRest(__VLS_641), false));
// @ts-ignore
[appSpinnerProps,];
var __VLS_617;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_645 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_646 = __VLS_asFunctionalComponent1(__VLS_645, new __VLS_645({
    name: "CircularProgress",
    description: "Circular progress indicator",
    props: (__VLS_ctx.circularProgressProps),
}));
var __VLS_647 = __VLS_646.apply(void 0, __spreadArray([{
        name: "CircularProgress",
        description: "Circular progress indicator",
        props: (__VLS_ctx.circularProgressProps),
    }], __VLS_functionalComponentArgsRest(__VLS_646), false));
var __VLS_650 = __VLS_648.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center q-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-lg']} */ ;
var __VLS_651 = CircularProgress_vue_1.default;
// @ts-ignore
var __VLS_652 = __VLS_asFunctionalComponent1(__VLS_651, new __VLS_651({
    indeterminate: true,
    size: "40px",
}));
var __VLS_653 = __VLS_652.apply(void 0, __spreadArray([{
        indeterminate: true,
        size: "40px",
    }], __VLS_functionalComponentArgsRest(__VLS_652), false));
var __VLS_656 = CircularProgress_vue_1.default;
// @ts-ignore
var __VLS_657 = __VLS_asFunctionalComponent1(__VLS_656, new __VLS_656({
    value: (0.3),
    size: "50px",
    showValue: true,
}));
var __VLS_658 = __VLS_657.apply(void 0, __spreadArray([{
        value: (0.3),
        size: "50px",
        showValue: true,
    }], __VLS_functionalComponentArgsRest(__VLS_657), false));
var __VLS_661 = CircularProgress_vue_1.default;
// @ts-ignore
var __VLS_662 = __VLS_asFunctionalComponent1(__VLS_661, new __VLS_661({
    value: (0.7),
    size: "60px",
    color: "positive",
    showValue: true,
}));
var __VLS_663 = __VLS_662.apply(void 0, __spreadArray([{
        value: (0.7),
        size: "60px",
        color: "positive",
        showValue: true,
    }], __VLS_functionalComponentArgsRest(__VLS_662), false));
// @ts-ignore
[circularProgressProps,];
var __VLS_648;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_666 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_667 = __VLS_asFunctionalComponent1(__VLS_666, new __VLS_666({
    name: "AppProgress",
    description: "Linear progress bar",
    props: (__VLS_ctx.appProgressProps),
}));
var __VLS_668 = __VLS_667.apply(void 0, __spreadArray([{
        name: "AppProgress",
        description: "Linear progress bar",
        props: (__VLS_ctx.appProgressProps),
    }], __VLS_functionalComponentArgsRest(__VLS_667), false));
var __VLS_671 = __VLS_669.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_672 = AppProgress_vue_1.default;
// @ts-ignore
var __VLS_673 = __VLS_asFunctionalComponent1(__VLS_672, new __VLS_672({
    indeterminate: true,
}));
var __VLS_674 = __VLS_673.apply(void 0, __spreadArray([{
        indeterminate: true,
    }], __VLS_functionalComponentArgsRest(__VLS_673), false));
var __VLS_677 = AppProgress_vue_1.default;
// @ts-ignore
var __VLS_678 = __VLS_asFunctionalComponent1(__VLS_677, new __VLS_677({
    value: (0.4),
    color: "positive",
}));
var __VLS_679 = __VLS_678.apply(void 0, __spreadArray([{
        value: (0.4),
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_678), false));
var __VLS_682 = AppProgress_vue_1.default;
// @ts-ignore
var __VLS_683 = __VLS_asFunctionalComponent1(__VLS_682, new __VLS_682({
    value: (0.6),
    stripe: true,
    color: "warning",
}));
var __VLS_684 = __VLS_683.apply(void 0, __spreadArray([{
        value: (0.6),
        stripe: true,
        color: "warning",
    }], __VLS_functionalComponentArgsRest(__VLS_683), false));
// @ts-ignore
[appProgressProps,];
var __VLS_669;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_687 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_688 = __VLS_asFunctionalComponent1(__VLS_687, new __VLS_687({
    name: "AppSkeleton",
    description: "Loading placeholder skeleton",
    props: (__VLS_ctx.appSkeletonProps),
}));
var __VLS_689 = __VLS_688.apply(void 0, __spreadArray([{
        name: "AppSkeleton",
        description: "Loading placeholder skeleton",
        props: (__VLS_ctx.appSkeletonProps),
    }], __VLS_functionalComponentArgsRest(__VLS_688), false));
var __VLS_692 = __VLS_690.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_693 = AppSkeleton_vue_1.default;
// @ts-ignore
var __VLS_694 = __VLS_asFunctionalComponent1(__VLS_693, new __VLS_693({
    type: "text",
}));
var __VLS_695 = __VLS_694.apply(void 0, __spreadArray([{
        type: "text",
    }], __VLS_functionalComponentArgsRest(__VLS_694), false));
var __VLS_698 = AppSkeleton_vue_1.default;
// @ts-ignore
var __VLS_699 = __VLS_asFunctionalComponent1(__VLS_698, new __VLS_698({
    type: "text",
    width: "60%",
}));
var __VLS_700 = __VLS_699.apply(void 0, __spreadArray([{
        type: "text",
        width: "60%",
    }], __VLS_functionalComponentArgsRest(__VLS_699), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_703 = AppSkeleton_vue_1.default;
// @ts-ignore
var __VLS_704 = __VLS_asFunctionalComponent1(__VLS_703, new __VLS_703({
    type: "circle",
    size: "40px",
}));
var __VLS_705 = __VLS_704.apply(void 0, __spreadArray([{
        type: "circle",
        size: "40px",
    }], __VLS_functionalComponentArgsRest(__VLS_704), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex-grow-1" }));
/** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
var __VLS_708 = AppSkeleton_vue_1.default;
// @ts-ignore
var __VLS_709 = __VLS_asFunctionalComponent1(__VLS_708, new __VLS_708({
    type: "text",
}));
var __VLS_710 = __VLS_709.apply(void 0, __spreadArray([{
        type: "text",
    }], __VLS_functionalComponentArgsRest(__VLS_709), false));
var __VLS_713 = AppSkeleton_vue_1.default;
// @ts-ignore
var __VLS_714 = __VLS_asFunctionalComponent1(__VLS_713, new __VLS_713({
    type: "text",
    width: "50%",
}));
var __VLS_715 = __VLS_714.apply(void 0, __spreadArray([{
        type: "text",
        width: "50%",
    }], __VLS_functionalComponentArgsRest(__VLS_714), false));
// @ts-ignore
[appSkeletonProps,];
var __VLS_690;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_718 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_719 = __VLS_asFunctionalComponent1(__VLS_718, new __VLS_718({
    name: "EmptyState",
    description: "Empty state display with icon and text",
    props: (__VLS_ctx.emptyStateProps),
}));
var __VLS_720 = __VLS_719.apply(void 0, __spreadArray([{
        name: "EmptyState",
        description: "Empty state display with icon and text",
        props: (__VLS_ctx.emptyStateProps),
    }], __VLS_functionalComponentArgsRest(__VLS_719), false));
var __VLS_723 = __VLS_721.slots.default;
var __VLS_724 = EmptyState_vue_1.default;
// @ts-ignore
var __VLS_725 = __VLS_asFunctionalComponent1(__VLS_724, new __VLS_724({
    icon: "inbox",
    title: "Không có dữ liệu",
    subtitle: "Chưa có dữ liệu nào được thêm vào",
}));
var __VLS_726 = __VLS_725.apply(void 0, __spreadArray([{
        icon: "inbox",
        title: "Không có dữ liệu",
        subtitle: "Chưa có dữ liệu nào được thêm vào",
    }], __VLS_functionalComponentArgsRest(__VLS_725), false));
// @ts-ignore
[emptyStateProps,];
var __VLS_721;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_729 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_730 = __VLS_asFunctionalComponent1(__VLS_729, new __VLS_729({
    name: "AppBanner",
    description: "Banner notification",
    props: (__VLS_ctx.appBannerProps),
}));
var __VLS_731 = __VLS_730.apply(void 0, __spreadArray([{
        name: "AppBanner",
        description: "Banner notification",
        props: (__VLS_ctx.appBannerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_730), false));
var __VLS_734 = __VLS_732.slots.default;
var __VLS_735 = AppBanner_vue_1.default || AppBanner_vue_1.default;
// @ts-ignore
var __VLS_736 = __VLS_asFunctionalComponent1(__VLS_735, new __VLS_735(__assign({ modelValue: (__VLS_ctx.showBanner), rounded: true }, { class: "bg-info text-white" })));
var __VLS_737 = __VLS_736.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.showBanner), rounded: true }, { class: "bg-info text-white" })], __VLS_functionalComponentArgsRest(__VLS_736), false));
/** @type {__VLS_StyleScopedClasses['bg-info']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
var __VLS_740 = __VLS_738.slots.default;
{
    var __VLS_741 = __VLS_738.slots.avatar;
    var __VLS_742 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_743 = __VLS_asFunctionalComponent1(__VLS_742, new __VLS_742({
        name: "info",
    }));
    var __VLS_744 = __VLS_743.apply(void 0, __spreadArray([{
            name: "info",
        }], __VLS_functionalComponentArgsRest(__VLS_743), false));
    // @ts-ignore
    [appBannerProps, showBanner,];
}
{
    var __VLS_747 = __VLS_738.slots.action;
    var __VLS_748 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_749 = __VLS_asFunctionalComponent1(__VLS_748, new __VLS_748(__assign({ 'onClick': {} }, { flat: true, label: "Đóng" })));
    var __VLS_750 = __VLS_749.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Đóng" })], __VLS_functionalComponentArgsRest(__VLS_749), false));
    var __VLS_753 = void 0;
    var __VLS_754 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.showBanner = false;
                // @ts-ignore
                [showBanner,];
            } });
    var __VLS_751;
    var __VLS_752;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_738;
if (!__VLS_ctx.showBanner) {
    var __VLS_755 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_756 = __VLS_asFunctionalComponent1(__VLS_755, new __VLS_755(__assign({ 'onClick': {} }, { label: "Hiện Banner" })));
    var __VLS_757 = __VLS_756.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Hiện Banner" })], __VLS_functionalComponentArgsRest(__VLS_756), false));
    var __VLS_760 = void 0;
    var __VLS_761 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(!__VLS_ctx.showBanner))
                    return;
                __VLS_ctx.showBanner = true;
                // @ts-ignore
                [showBanner, showBanner,];
            } });
    var __VLS_758;
    var __VLS_759;
}
// @ts-ignore
[];
var __VLS_732;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_762 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_763 = __VLS_asFunctionalComponent1(__VLS_762, new __VLS_762({
    name: "InnerLoading",
    description: "Inner loading overlay",
    props: (__VLS_ctx.innerLoadingProps),
}));
var __VLS_764 = __VLS_763.apply(void 0, __spreadArray([{
        name: "InnerLoading",
        description: "Inner loading overlay",
        props: (__VLS_ctx.innerLoadingProps),
    }], __VLS_functionalComponentArgsRest(__VLS_763), false));
var __VLS_767 = __VLS_765.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "relative-position" }, { style: {} }));
/** @type {__VLS_StyleScopedClasses['relative-position']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pt-lg" }));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pt-lg']} */ ;
var __VLS_768 = InnerLoading_vue_1.default;
// @ts-ignore
var __VLS_769 = __VLS_asFunctionalComponent1(__VLS_768, new __VLS_768({
    showing: (__VLS_ctx.showInnerLoading),
    label: "Đang tải...",
}));
var __VLS_770 = __VLS_769.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.showInnerLoading),
        label: "Đang tải...",
    }], __VLS_functionalComponentArgsRest(__VLS_769), false));
var __VLS_773 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_774 = __VLS_asFunctionalComponent1(__VLS_773, new __VLS_773(__assign(__assign({ 'onClick': {} }, { class: "q-mt-sm" }), { label: (__VLS_ctx.showInnerLoading ? 'Ẩn Loading' : 'Hiện Loading') })));
var __VLS_775 = __VLS_774.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { class: "q-mt-sm" }), { label: (__VLS_ctx.showInnerLoading ? 'Ẩn Loading' : 'Hiện Loading') })], __VLS_functionalComponentArgsRest(__VLS_774), false));
var __VLS_778;
var __VLS_779 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showInnerLoading = !__VLS_ctx.showInnerLoading;
            // @ts-ignore
            [innerLoadingProps, showInnerLoading, showInnerLoading, showInnerLoading, showInnerLoading,];
        } });
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
var __VLS_776;
var __VLS_777;
// @ts-ignore
[];
var __VLS_765;
// @ts-ignore
[];
var __VLS_611;
var __VLS_780;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_781 = __VLS_asFunctionalComponent1(__VLS_780, new __VLS_780({
    name: "navigation",
}));
var __VLS_782 = __VLS_781.apply(void 0, __spreadArray([{
        name: "navigation",
    }], __VLS_functionalComponentArgsRest(__VLS_781), false));
var __VLS_785 = __VLS_783.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_786 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_787 = __VLS_asFunctionalComponent1(__VLS_786, new __VLS_786({
    name: "AppTabs / TabPanel",
    description: "Tab navigation with panels",
    props: (__VLS_ctx.appTabsProps),
}));
var __VLS_788 = __VLS_787.apply(void 0, __spreadArray([{
        name: "AppTabs / TabPanel",
        description: "Tab navigation with panels",
        props: (__VLS_ctx.appTabsProps),
    }], __VLS_functionalComponentArgsRest(__VLS_787), false));
var __VLS_791 = __VLS_789.slots.default;
var __VLS_792 = AppTabs_vue_1.default || AppTabs_vue_1.default;
// @ts-ignore
var __VLS_793 = __VLS_asFunctionalComponent1(__VLS_792, new __VLS_792({
    modelValue: (__VLS_ctx.demoTab),
}));
var __VLS_794 = __VLS_793.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.demoTab),
    }], __VLS_functionalComponentArgsRest(__VLS_793), false));
var __VLS_797 = __VLS_795.slots.default;
var __VLS_798;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_799 = __VLS_asFunctionalComponent1(__VLS_798, new __VLS_798({
    name: "tab1",
    label: "Tab 1",
    icon: "home",
}));
var __VLS_800 = __VLS_799.apply(void 0, __spreadArray([{
        name: "tab1",
        label: "Tab 1",
        icon: "home",
    }], __VLS_functionalComponentArgsRest(__VLS_799), false));
var __VLS_803;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_804 = __VLS_asFunctionalComponent1(__VLS_803, new __VLS_803({
    name: "tab2",
    label: "Tab 2",
    icon: "settings",
}));
var __VLS_805 = __VLS_804.apply(void 0, __spreadArray([{
        name: "tab2",
        label: "Tab 2",
        icon: "settings",
    }], __VLS_functionalComponentArgsRest(__VLS_804), false));
var __VLS_808;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_809 = __VLS_asFunctionalComponent1(__VLS_808, new __VLS_808({
    name: "tab3",
    label: "Tab 3",
    icon: "person",
}));
var __VLS_810 = __VLS_809.apply(void 0, __spreadArray([{
        name: "tab3",
        label: "Tab 3",
        icon: "person",
    }], __VLS_functionalComponentArgsRest(__VLS_809), false));
// @ts-ignore
[appTabsProps, demoTab,];
var __VLS_795;
var __VLS_813;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_814 = __VLS_asFunctionalComponent1(__VLS_813, new __VLS_813(__assign({ modelValue: (__VLS_ctx.demoTab), animated: true }, { class: "q-mt-sm" })));
var __VLS_815 = __VLS_814.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.demoTab), animated: true }, { class: "q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_814), false));
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
var __VLS_818 = __VLS_816.slots.default;
var __VLS_819 = TabPanel_vue_1.default || TabPanel_vue_1.default;
// @ts-ignore
var __VLS_820 = __VLS_asFunctionalComponent1(__VLS_819, new __VLS_819({
    name: "tab1",
}));
var __VLS_821 = __VLS_820.apply(void 0, __spreadArray([{
        name: "tab1",
    }], __VLS_functionalComponentArgsRest(__VLS_820), false));
var __VLS_824 = __VLS_822.slots.default;
// @ts-ignore
[demoTab,];
var __VLS_822;
var __VLS_825 = TabPanel_vue_1.default || TabPanel_vue_1.default;
// @ts-ignore
var __VLS_826 = __VLS_asFunctionalComponent1(__VLS_825, new __VLS_825({
    name: "tab2",
}));
var __VLS_827 = __VLS_826.apply(void 0, __spreadArray([{
        name: "tab2",
    }], __VLS_functionalComponentArgsRest(__VLS_826), false));
var __VLS_830 = __VLS_828.slots.default;
// @ts-ignore
[];
var __VLS_828;
var __VLS_831 = TabPanel_vue_1.default || TabPanel_vue_1.default;
// @ts-ignore
var __VLS_832 = __VLS_asFunctionalComponent1(__VLS_831, new __VLS_831({
    name: "tab3",
}));
var __VLS_833 = __VLS_832.apply(void 0, __spreadArray([{
        name: "tab3",
    }], __VLS_functionalComponentArgsRest(__VLS_832), false));
var __VLS_836 = __VLS_834.slots.default;
// @ts-ignore
[];
var __VLS_834;
// @ts-ignore
[];
var __VLS_816;
// @ts-ignore
[];
var __VLS_789;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_837 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_838 = __VLS_asFunctionalComponent1(__VLS_837, new __VLS_837({
    name: "AppStepper / StepperStep",
    description: "Step-by-step wizard",
    props: (__VLS_ctx.appStepperProps),
}));
var __VLS_839 = __VLS_838.apply(void 0, __spreadArray([{
        name: "AppStepper / StepperStep",
        description: "Step-by-step wizard",
        props: (__VLS_ctx.appStepperProps),
    }], __VLS_functionalComponentArgsRest(__VLS_838), false));
var __VLS_842 = __VLS_840.slots.default;
var __VLS_843 = AppStepper_vue_1.default || AppStepper_vue_1.default;
// @ts-ignore
var __VLS_844 = __VLS_asFunctionalComponent1(__VLS_843, new __VLS_843({
    modelValue: __VLS_ctx.stepValue,
    headerNav: true,
    animated: true,
}));
var __VLS_845 = __VLS_844.apply(void 0, __spreadArray([{
        modelValue: __VLS_ctx.stepValue,
        headerNav: true,
        animated: true,
    }], __VLS_functionalComponentArgsRest(__VLS_844), false));
var __VLS_848 = __VLS_846.slots.default;
var __VLS_849 = StepperStep_vue_1.default || StepperStep_vue_1.default;
// @ts-ignore
var __VLS_850 = __VLS_asFunctionalComponent1(__VLS_849, new __VLS_849({
    name: (1),
    title: "Bước 1",
    caption: "Thông tin cơ bản",
    icon: "person",
}));
var __VLS_851 = __VLS_850.apply(void 0, __spreadArray([{
        name: (1),
        title: "Bước 1",
        caption: "Thông tin cơ bản",
        icon: "person",
    }], __VLS_functionalComponentArgsRest(__VLS_850), false));
var __VLS_854 = __VLS_852.slots.default;
// @ts-ignore
[appStepperProps, stepValue,];
var __VLS_852;
var __VLS_855 = StepperStep_vue_1.default || StepperStep_vue_1.default;
// @ts-ignore
var __VLS_856 = __VLS_asFunctionalComponent1(__VLS_855, new __VLS_855({
    name: (2),
    title: "Bước 2",
    caption: "Chi tiết",
    icon: "description",
}));
var __VLS_857 = __VLS_856.apply(void 0, __spreadArray([{
        name: (2),
        title: "Bước 2",
        caption: "Chi tiết",
        icon: "description",
    }], __VLS_functionalComponentArgsRest(__VLS_856), false));
var __VLS_860 = __VLS_858.slots.default;
// @ts-ignore
[];
var __VLS_858;
var __VLS_861 = StepperStep_vue_1.default || StepperStep_vue_1.default;
// @ts-ignore
var __VLS_862 = __VLS_asFunctionalComponent1(__VLS_861, new __VLS_861({
    name: (3),
    title: "Bước 3",
    caption: "Xác nhận",
    icon: "check",
}));
var __VLS_863 = __VLS_862.apply(void 0, __spreadArray([{
        name: (3),
        title: "Bước 3",
        caption: "Xác nhận",
        icon: "check",
    }], __VLS_functionalComponentArgsRest(__VLS_862), false));
var __VLS_866 = __VLS_864.slots.default;
// @ts-ignore
[];
var __VLS_864;
{
    var __VLS_867 = __VLS_846.slots.navigation;
    var __VLS_868 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
    qStepperNavigation;
    // @ts-ignore
    var __VLS_869 = __VLS_asFunctionalComponent1(__VLS_868, new __VLS_868({}));
    var __VLS_870 = __VLS_869.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_869), false));
    var __VLS_873 = __VLS_871.slots.default;
    var __VLS_874 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_875 = __VLS_asFunctionalComponent1(__VLS_874, new __VLS_874(__assign({ 'onClick': {} }, { label: (__VLS_ctx.stepValue === 3 ? 'Hoàn tất' : 'Tiếp') })));
    var __VLS_876 = __VLS_875.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: (__VLS_ctx.stepValue === 3 ? 'Hoàn tất' : 'Tiếp') })], __VLS_functionalComponentArgsRest(__VLS_875), false));
    var __VLS_879 = void 0;
    var __VLS_880 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.stepValue = Math.min(__VLS_ctx.stepValue + 1, 3);
                // @ts-ignore
                [stepValue, stepValue, stepValue,];
            } });
    var __VLS_877;
    var __VLS_878;
    if (__VLS_ctx.stepValue > 1) {
        var __VLS_881 = AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_882 = __VLS_asFunctionalComponent1(__VLS_881, new __VLS_881(__assign(__assign({ 'onClick': {} }, { variant: "flat", label: "Quay lại" }), { class: "q-ml-sm" })));
        var __VLS_883 = __VLS_882.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { variant: "flat", label: "Quay lại" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_882), false));
        var __VLS_886 = void 0;
        var __VLS_887 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.stepValue > 1))
                        return;
                    __VLS_ctx.stepValue--;
                    // @ts-ignore
                    [stepValue, stepValue,];
                } });
        /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        var __VLS_884;
        var __VLS_885;
    }
    // @ts-ignore
    [];
    var __VLS_871;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_846;
// @ts-ignore
[];
var __VLS_840;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_888 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_889 = __VLS_asFunctionalComponent1(__VLS_888, new __VLS_888({
    name: "AppPagination",
    description: "Pagination control",
    props: (__VLS_ctx.appPaginationProps),
}));
var __VLS_890 = __VLS_889.apply(void 0, __spreadArray([{
        name: "AppPagination",
        description: "Pagination control",
        props: (__VLS_ctx.appPaginationProps),
    }], __VLS_functionalComponentArgsRest(__VLS_889), false));
var __VLS_893 = __VLS_891.slots.default;
var __VLS_894 = AppPagination_vue_1.default;
// @ts-ignore
var __VLS_895 = __VLS_asFunctionalComponent1(__VLS_894, new __VLS_894({
    modelValue: (__VLS_ctx.pageValue),
    max: (10),
    directionLinks: true,
    boundaryLinks: true,
}));
var __VLS_896 = __VLS_895.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.pageValue),
        max: (10),
        directionLinks: true,
        boundaryLinks: true,
    }], __VLS_functionalComponentArgsRest(__VLS_895), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
(__VLS_ctx.pageValue);
// @ts-ignore
[appPaginationProps, pageValue, pageValue,];
var __VLS_891;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_899 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_900 = __VLS_asFunctionalComponent1(__VLS_899, new __VLS_899({
    name: "AppBreadcrumbs",
    description: "Breadcrumb navigation",
    props: (__VLS_ctx.appBreadcrumbsProps),
}));
var __VLS_901 = __VLS_900.apply(void 0, __spreadArray([{
        name: "AppBreadcrumbs",
        description: "Breadcrumb navigation",
        props: (__VLS_ctx.appBreadcrumbsProps),
    }], __VLS_functionalComponentArgsRest(__VLS_900), false));
var __VLS_904 = __VLS_902.slots.default;
var __VLS_905 = AppBreadcrumbs_vue_1.default;
// @ts-ignore
var __VLS_906 = __VLS_asFunctionalComponent1(__VLS_905, new __VLS_905({
    items: ([
        { label: 'Trang chủ', icon: 'home', to: '/' },
        { label: 'Danh mục' },
        { label: 'Trang hiện tại' }
    ]),
}));
var __VLS_907 = __VLS_906.apply(void 0, __spreadArray([{
        items: ([
            { label: 'Trang chủ', icon: 'home', to: '/' },
            { label: 'Danh mục' },
            { label: 'Trang hiện tại' }
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_906), false));
// @ts-ignore
[appBreadcrumbsProps,];
var __VLS_902;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_910 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_911 = __VLS_asFunctionalComponent1(__VLS_910, new __VLS_910({
    name: "SidebarItem",
    description: "Sidebar navigation item",
    props: (__VLS_ctx.sidebarItemProps),
}));
var __VLS_912 = __VLS_911.apply(void 0, __spreadArray([{
        name: "SidebarItem",
        description: "Sidebar navigation item",
        props: (__VLS_ctx.sidebarItemProps),
    }], __VLS_functionalComponentArgsRest(__VLS_911), false));
var __VLS_915 = __VLS_913.slots.default;
var __VLS_916;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_917 = __VLS_asFunctionalComponent1(__VLS_916, new __VLS_916(__assign(__assign({ bordered: true }, { class: "rounded-borders" }), { style: {} })));
var __VLS_918 = __VLS_917.apply(void 0, __spreadArray([__assign(__assign({ bordered: true }, { class: "rounded-borders" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_917), false));
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
var __VLS_921 = __VLS_919.slots.default;
var __VLS_922 = SidebarItem_vue_1.default;
// @ts-ignore
var __VLS_923 = __VLS_asFunctionalComponent1(__VLS_922, new __VLS_922({
    item: ({ icon: 'home', label: 'Trang chủ', to: '/' }),
}));
var __VLS_924 = __VLS_923.apply(void 0, __spreadArray([{
        item: ({ icon: 'home', label: 'Trang chủ', to: '/' }),
    }], __VLS_functionalComponentArgsRest(__VLS_923), false));
var __VLS_927 = SidebarItem_vue_1.default;
// @ts-ignore
var __VLS_928 = __VLS_asFunctionalComponent1(__VLS_927, new __VLS_927({
    item: ({ icon: 'people', label: 'Nhân viên', to: '/employees' }),
}));
var __VLS_929 = __VLS_928.apply(void 0, __spreadArray([{
        item: ({ icon: 'people', label: 'Nhân viên', to: '/employees' }),
    }], __VLS_functionalComponentArgsRest(__VLS_928), false));
var __VLS_932 = SidebarItem_vue_1.default;
// @ts-ignore
var __VLS_933 = __VLS_asFunctionalComponent1(__VLS_932, new __VLS_932({
    item: ({ icon: 'settings', label: 'Cài đặt' }),
}));
var __VLS_934 = __VLS_933.apply(void 0, __spreadArray([{
        item: ({ icon: 'settings', label: 'Cài đặt' }),
    }], __VLS_functionalComponentArgsRest(__VLS_933), false));
// @ts-ignore
[sidebarItemProps,];
var __VLS_919;
// @ts-ignore
[];
var __VLS_913;
// @ts-ignore
[];
var __VLS_783;
var __VLS_937;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_938 = __VLS_asFunctionalComponent1(__VLS_937, new __VLS_937({
    name: "layout",
}));
var __VLS_939 = __VLS_938.apply(void 0, __spreadArray([{
        name: "layout",
    }], __VLS_functionalComponentArgsRest(__VLS_938), false));
var __VLS_942 = __VLS_940.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_943 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_944 = __VLS_asFunctionalComponent1(__VLS_943, new __VLS_943({
    name: "PageHeader",
    description: "Page header with title and actions",
    props: (__VLS_ctx.pageHeaderProps),
}));
var __VLS_945 = __VLS_944.apply(void 0, __spreadArray([{
        name: "PageHeader",
        description: "Page header with title and actions",
        props: (__VLS_ctx.pageHeaderProps),
    }], __VLS_functionalComponentArgsRest(__VLS_944), false));
var __VLS_948 = __VLS_946.slots.default;
var __VLS_949 = PageHeader_vue_1.default || PageHeader_vue_1.default;
// @ts-ignore
var __VLS_950 = __VLS_asFunctionalComponent1(__VLS_949, new __VLS_949({
    title: "Quản lý nhân viên",
    subtitle: "Danh sách tất cả nhân viên trong hệ thống",
    icon: "people",
}));
var __VLS_951 = __VLS_950.apply(void 0, __spreadArray([{
        title: "Quản lý nhân viên",
        subtitle: "Danh sách tất cả nhân viên trong hệ thống",
        icon: "people",
    }], __VLS_functionalComponentArgsRest(__VLS_950), false));
var __VLS_954 = __VLS_952.slots.default;
{
    var __VLS_955 = __VLS_952.slots.actions;
    var __VLS_956 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_957 = __VLS_asFunctionalComponent1(__VLS_956, new __VLS_956({
        icon: "add",
        label: "Thêm mới",
    }));
    var __VLS_958 = __VLS_957.apply(void 0, __spreadArray([{
            icon: "add",
            label: "Thêm mới",
        }], __VLS_functionalComponentArgsRest(__VLS_957), false));
    // @ts-ignore
    [pageHeaderProps,];
}
// @ts-ignore
[];
var __VLS_952;
// @ts-ignore
[];
var __VLS_946;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_961 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_962 = __VLS_asFunctionalComponent1(__VLS_961, new __VLS_961({
    name: "SectionHeader",
    description: "Section header divider",
    props: (__VLS_ctx.sectionHeaderProps),
}));
var __VLS_963 = __VLS_962.apply(void 0, __spreadArray([{
        name: "SectionHeader",
        description: "Section header divider",
        props: (__VLS_ctx.sectionHeaderProps),
    }], __VLS_functionalComponentArgsRest(__VLS_962), false));
var __VLS_966 = __VLS_964.slots.default;
var __VLS_967 = SectionHeader_vue_1.default;
// @ts-ignore
var __VLS_968 = __VLS_asFunctionalComponent1(__VLS_967, new __VLS_967({
    title: "Thông tin cá nhân",
    icon: "person",
}));
var __VLS_969 = __VLS_968.apply(void 0, __spreadArray([{
        title: "Thông tin cá nhân",
        icon: "person",
    }], __VLS_functionalComponentArgsRest(__VLS_968), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md bg-grey-2 rounded-borders" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
// @ts-ignore
[sectionHeaderProps,];
var __VLS_964;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_972 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_973 = __VLS_asFunctionalComponent1(__VLS_972, new __VLS_972({
    name: "AppToolbar",
    description: "Toolbar with actions",
    props: (__VLS_ctx.appToolbarProps),
}));
var __VLS_974 = __VLS_973.apply(void 0, __spreadArray([{
        name: "AppToolbar",
        description: "Toolbar with actions",
        props: (__VLS_ctx.appToolbarProps),
    }], __VLS_functionalComponentArgsRest(__VLS_973), false));
var __VLS_977 = __VLS_975.slots.default;
var __VLS_978 = AppToolbar_vue_1.default || AppToolbar_vue_1.default;
// @ts-ignore
var __VLS_979 = __VLS_asFunctionalComponent1(__VLS_978, new __VLS_978(__assign({ class: "bg-primary text-white" })));
var __VLS_980 = __VLS_979.apply(void 0, __spreadArray([__assign({ class: "bg-primary text-white" })], __VLS_functionalComponentArgsRest(__VLS_979), false));
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
var __VLS_983 = __VLS_981.slots.default;
var __VLS_984;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_985 = __VLS_asFunctionalComponent1(__VLS_984, new __VLS_984({
    flat: true,
    round: true,
    dense: true,
    icon: "menu",
}));
var __VLS_986 = __VLS_985.apply(void 0, __spreadArray([{
        flat: true,
        round: true,
        dense: true,
        icon: "menu",
    }], __VLS_functionalComponentArgsRest(__VLS_985), false));
var __VLS_989;
/** @ts-ignore @type {typeof __VLS_components.qToolbarTitle | typeof __VLS_components.QToolbarTitle | typeof __VLS_components.qToolbarTitle | typeof __VLS_components.QToolbarTitle} */
qToolbarTitle;
// @ts-ignore
var __VLS_990 = __VLS_asFunctionalComponent1(__VLS_989, new __VLS_989({}));
var __VLS_991 = __VLS_990.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_990), false));
var __VLS_994 = __VLS_992.slots.default;
// @ts-ignore
[appToolbarProps,];
var __VLS_992;
var __VLS_995;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_996 = __VLS_asFunctionalComponent1(__VLS_995, new __VLS_995({
    flat: true,
    round: true,
    dense: true,
    icon: "search",
}));
var __VLS_997 = __VLS_996.apply(void 0, __spreadArray([{
        flat: true,
        round: true,
        dense: true,
        icon: "search",
    }], __VLS_functionalComponentArgsRest(__VLS_996), false));
var __VLS_1000;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_1001 = __VLS_asFunctionalComponent1(__VLS_1000, new __VLS_1000({
    flat: true,
    round: true,
    dense: true,
    icon: "more_vert",
}));
var __VLS_1002 = __VLS_1001.apply(void 0, __spreadArray([{
        flat: true,
        round: true,
        dense: true,
        icon: "more_vert",
    }], __VLS_functionalComponentArgsRest(__VLS_1001), false));
// @ts-ignore
[];
var __VLS_981;
// @ts-ignore
[];
var __VLS_975;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1005 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1006 = __VLS_asFunctionalComponent1(__VLS_1005, new __VLS_1005({
    name: "AppSeparator",
    description: "Visual separator line",
    props: (__VLS_ctx.appSeparatorProps),
}));
var __VLS_1007 = __VLS_1006.apply(void 0, __spreadArray([{
        name: "AppSeparator",
        description: "Visual separator line",
        props: (__VLS_ctx.appSeparatorProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1006), false));
var __VLS_1010 = __VLS_1008.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
var __VLS_1011 = AppSeparator_vue_1.default;
// @ts-ignore
var __VLS_1012 = __VLS_asFunctionalComponent1(__VLS_1011, new __VLS_1011({
    spaced: true,
}));
var __VLS_1013 = __VLS_1012.apply(void 0, __spreadArray([{
        spaced: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1012), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
// @ts-ignore
[appSeparatorProps,];
var __VLS_1008;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1016 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1017 = __VLS_asFunctionalComponent1(__VLS_1016, new __VLS_1016({
    name: "AppSpace",
    description: "Flexible space component",
    props: (__VLS_ctx.appSpaceProps),
}));
var __VLS_1018 = __VLS_1017.apply(void 0, __spreadArray([{
        name: "AppSpace",
        description: "Flexible space component",
        props: (__VLS_ctx.appSpaceProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1017), false));
var __VLS_1021 = __VLS_1019.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
var __VLS_1022 = AppSpace_vue_1.default;
// @ts-ignore
var __VLS_1023 = __VLS_asFunctionalComponent1(__VLS_1022, new __VLS_1022({}));
var __VLS_1024 = __VLS_1023.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1023), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
// @ts-ignore
[appSpaceProps,];
var __VLS_1019;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1027 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1028 = __VLS_asFunctionalComponent1(__VLS_1027, new __VLS_1027({
    name: "AppDrawer",
    description: "Side drawer navigation",
    props: (__VLS_ctx.appDrawerProps),
}));
var __VLS_1029 = __VLS_1028.apply(void 0, __spreadArray([{
        name: "AppDrawer",
        description: "Side drawer navigation",
        props: (__VLS_ctx.appDrawerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1028), false));
var __VLS_1032 = __VLS_1030.slots.default;
var __VLS_1033 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_1034 = __VLS_asFunctionalComponent1(__VLS_1033, new __VLS_1033(__assign({ 'onClick': {} }, { label: "Mở Drawer" })));
var __VLS_1035 = __VLS_1034.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Mở Drawer" })], __VLS_functionalComponentArgsRest(__VLS_1034), false));
var __VLS_1038;
var __VLS_1039 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showDrawer = true;
            // @ts-ignore
            [appDrawerProps, showDrawer,];
        } });
var __VLS_1036;
var __VLS_1037;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
// @ts-ignore
[];
var __VLS_1030;
// @ts-ignore
[];
var __VLS_940;
var __VLS_1040;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_1041 = __VLS_asFunctionalComponent1(__VLS_1040, new __VLS_1040({
    name: "cards",
}));
var __VLS_1042 = __VLS_1041.apply(void 0, __spreadArray([{
        name: "cards",
    }], __VLS_functionalComponentArgsRest(__VLS_1041), false));
var __VLS_1045 = __VLS_1043.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1046 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1047 = __VLS_asFunctionalComponent1(__VLS_1046, new __VLS_1046({
    name: "AppCard",
    description: "Base card container",
    props: (__VLS_ctx.appCardProps),
}));
var __VLS_1048 = __VLS_1047.apply(void 0, __spreadArray([{
        name: "AppCard",
        description: "Base card container",
        props: (__VLS_ctx.appCardProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1047), false));
var __VLS_1051 = __VLS_1049.slots.default;
var __VLS_1052 = AppCard_vue_1.default || AppCard_vue_1.default;
// @ts-ignore
var __VLS_1053 = __VLS_asFunctionalComponent1(__VLS_1052, new __VLS_1052({
    bordered: true,
}));
var __VLS_1054 = __VLS_1053.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1053), false));
var __VLS_1057 = __VLS_1055.slots.default;
var __VLS_1058;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_1059 = __VLS_asFunctionalComponent1(__VLS_1058, new __VLS_1058({}));
var __VLS_1060 = __VLS_1059.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1059), false));
var __VLS_1063 = __VLS_1061.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
// @ts-ignore
[appCardProps,];
var __VLS_1061;
var __VLS_1064;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_1065 = __VLS_asFunctionalComponent1(__VLS_1064, new __VLS_1064({}));
var __VLS_1066 = __VLS_1065.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1065), false));
var __VLS_1069 = __VLS_1067.slots.default;
// @ts-ignore
[];
var __VLS_1067;
var __VLS_1070;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_1071 = __VLS_asFunctionalComponent1(__VLS_1070, new __VLS_1070({
    align: "right",
}));
var __VLS_1072 = __VLS_1071.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_1071), false));
var __VLS_1075 = __VLS_1073.slots.default;
var __VLS_1076 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_1077 = __VLS_asFunctionalComponent1(__VLS_1076, new __VLS_1076({
    variant: "flat",
    label: "Hành động",
}));
var __VLS_1078 = __VLS_1077.apply(void 0, __spreadArray([{
        variant: "flat",
        label: "Hành động",
    }], __VLS_functionalComponentArgsRest(__VLS_1077), false));
// @ts-ignore
[];
var __VLS_1073;
// @ts-ignore
[];
var __VLS_1055;
// @ts-ignore
[];
var __VLS_1049;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1081 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1082 = __VLS_asFunctionalComponent1(__VLS_1081, new __VLS_1081({
    name: "InfoCard",
    description: "Card with icon and info",
    props: (__VLS_ctx.infoCardProps),
}));
var __VLS_1083 = __VLS_1082.apply(void 0, __spreadArray([{
        name: "InfoCard",
        description: "Card with icon and info",
        props: (__VLS_ctx.infoCardProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1082), false));
var __VLS_1086 = __VLS_1084.slots.default;
var __VLS_1087 = InfoCard_vue_1.default;
// @ts-ignore
var __VLS_1088 = __VLS_asFunctionalComponent1(__VLS_1087, new __VLS_1087({
    title: "Thông tin quan trọng",
    subtitle: "Mô tả chi tiết về thông tin này",
    icon: "info",
    iconColor: "info",
}));
var __VLS_1089 = __VLS_1088.apply(void 0, __spreadArray([{
        title: "Thông tin quan trọng",
        subtitle: "Mô tả chi tiết về thông tin này",
        icon: "info",
        iconColor: "info",
    }], __VLS_functionalComponentArgsRest(__VLS_1088), false));
// @ts-ignore
[infoCardProps,];
var __VLS_1084;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_1092 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1093 = __VLS_asFunctionalComponent1(__VLS_1092, new __VLS_1092({
    name: "StatCard",
    description: "Statistics display card",
    props: (__VLS_ctx.statCardProps),
}));
var __VLS_1094 = __VLS_1093.apply(void 0, __spreadArray([{
        name: "StatCard",
        description: "Statistics display card",
        props: (__VLS_ctx.statCardProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1093), false));
var __VLS_1097 = __VLS_1095.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_1098 = StatCard_vue_1.default;
// @ts-ignore
var __VLS_1099 = __VLS_asFunctionalComponent1(__VLS_1098, new __VLS_1098({
    label: "Tổng nhân viên",
    value: "1,234",
    icon: "people",
    trend: "+5%",
}));
var __VLS_1100 = __VLS_1099.apply(void 0, __spreadArray([{
        label: "Tổng nhân viên",
        value: "1,234",
        icon: "people",
        trend: "+5%",
    }], __VLS_functionalComponentArgsRest(__VLS_1099), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_1103 = StatCard_vue_1.default;
// @ts-ignore
var __VLS_1104 = __VLS_asFunctionalComponent1(__VLS_1103, new __VLS_1103({
    label: "Doanh thu",
    value: "$52,000",
    icon: "attach_money",
    iconBgColor: "positive",
    trend: "+12%",
}));
var __VLS_1105 = __VLS_1104.apply(void 0, __spreadArray([{
        label: "Doanh thu",
        value: "$52,000",
        icon: "attach_money",
        iconBgColor: "positive",
        trend: "+12%",
    }], __VLS_functionalComponentArgsRest(__VLS_1104), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_1108 = StatCard_vue_1.default;
// @ts-ignore
var __VLS_1109 = __VLS_asFunctionalComponent1(__VLS_1108, new __VLS_1108({
    label: "Đơn hàng",
    value: "856",
    icon: "shopping_cart",
    iconBgColor: "warning",
    trend: "-3%",
    trendPositive: (false),
}));
var __VLS_1110 = __VLS_1109.apply(void 0, __spreadArray([{
        label: "Đơn hàng",
        value: "856",
        icon: "shopping_cart",
        iconBgColor: "warning",
        trend: "-3%",
        trendPositive: (false),
    }], __VLS_functionalComponentArgsRest(__VLS_1109), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_1113 = StatCard_vue_1.default;
// @ts-ignore
var __VLS_1114 = __VLS_asFunctionalComponent1(__VLS_1113, new __VLS_1113({
    label: "Khách hàng",
    value: "2,100",
    icon: "person_add",
    iconBgColor: "info",
}));
var __VLS_1115 = __VLS_1114.apply(void 0, __spreadArray([{
        label: "Khách hàng",
        value: "2,100",
        icon: "person_add",
        iconBgColor: "info",
    }], __VLS_functionalComponentArgsRest(__VLS_1114), false));
// @ts-ignore
[statCardProps,];
var __VLS_1095;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1118 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1119 = __VLS_asFunctionalComponent1(__VLS_1118, new __VLS_1118({
    name: "AppChip",
    description: "Chip/tag component",
    props: (__VLS_ctx.appChipProps),
}));
var __VLS_1120 = __VLS_1119.apply(void 0, __spreadArray([{
        name: "AppChip",
        description: "Chip/tag component",
        props: (__VLS_ctx.appChipProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1119), false));
var __VLS_1123 = __VLS_1121.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-wrap q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_1124 = AppChip_vue_1.default;
// @ts-ignore
var __VLS_1125 = __VLS_asFunctionalComponent1(__VLS_1124, new __VLS_1124({
    label: "Default",
}));
var __VLS_1126 = __VLS_1125.apply(void 0, __spreadArray([{
        label: "Default",
    }], __VLS_functionalComponentArgsRest(__VLS_1125), false));
var __VLS_1129 = AppChip_vue_1.default;
// @ts-ignore
var __VLS_1130 = __VLS_asFunctionalComponent1(__VLS_1129, new __VLS_1129({
    label: "Primary",
    color: "primary",
}));
var __VLS_1131 = __VLS_1130.apply(void 0, __spreadArray([{
        label: "Primary",
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_1130), false));
var __VLS_1134 = AppChip_vue_1.default;
// @ts-ignore
var __VLS_1135 = __VLS_asFunctionalComponent1(__VLS_1134, new __VLS_1134({
    label: "Positive",
    color: "positive",
}));
var __VLS_1136 = __VLS_1135.apply(void 0, __spreadArray([{
        label: "Positive",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_1135), false));
var __VLS_1139 = AppChip_vue_1.default;
// @ts-ignore
var __VLS_1140 = __VLS_asFunctionalComponent1(__VLS_1139, new __VLS_1139({
    label: "With Icon",
    icon: "star",
    color: "warning",
}));
var __VLS_1141 = __VLS_1140.apply(void 0, __spreadArray([{
        label: "With Icon",
        icon: "star",
        color: "warning",
    }], __VLS_functionalComponentArgsRest(__VLS_1140), false));
var __VLS_1144 = AppChip_vue_1.default;
// @ts-ignore
var __VLS_1145 = __VLS_asFunctionalComponent1(__VLS_1144, new __VLS_1144({
    label: "Removable",
    removable: true,
    color: "negative",
}));
var __VLS_1146 = __VLS_1145.apply(void 0, __spreadArray([{
        label: "Removable",
        removable: true,
        color: "negative",
    }], __VLS_functionalComponentArgsRest(__VLS_1145), false));
var __VLS_1149 = AppChip_vue_1.default;
// @ts-ignore
var __VLS_1150 = __VLS_asFunctionalComponent1(__VLS_1149, new __VLS_1149({
    label: "Outlined",
    outline: true,
    color: "info",
}));
var __VLS_1151 = __VLS_1150.apply(void 0, __spreadArray([{
        label: "Outlined",
        outline: true,
        color: "info",
    }], __VLS_functionalComponentArgsRest(__VLS_1150), false));
// @ts-ignore
[appChipProps,];
var __VLS_1121;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1154 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1155 = __VLS_asFunctionalComponent1(__VLS_1154, new __VLS_1154({
    name: "AppBadge",
    description: "Badge indicator",
    props: (__VLS_ctx.appBadgeProps),
}));
var __VLS_1156 = __VLS_1155.apply(void 0, __spreadArray([{
        name: "AppBadge",
        description: "Badge indicator",
        props: (__VLS_ctx.appBadgeProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1155), false));
var __VLS_1159 = __VLS_1157.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center q-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-lg']} */ ;
var __VLS_1160;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_1161 = __VLS_asFunctionalComponent1(__VLS_1160, new __VLS_1160({
    round: true,
    icon: "mail",
}));
var __VLS_1162 = __VLS_1161.apply(void 0, __spreadArray([{
        round: true,
        icon: "mail",
    }], __VLS_functionalComponentArgsRest(__VLS_1161), false));
var __VLS_1165 = __VLS_1163.slots.default;
var __VLS_1166 = AppBadge_vue_1.default;
// @ts-ignore
var __VLS_1167 = __VLS_asFunctionalComponent1(__VLS_1166, new __VLS_1166({
    label: "5",
    color: "negative",
    floating: true,
}));
var __VLS_1168 = __VLS_1167.apply(void 0, __spreadArray([{
        label: "5",
        color: "negative",
        floating: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1167), false));
// @ts-ignore
[appBadgeProps,];
var __VLS_1163;
var __VLS_1171;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_1172 = __VLS_asFunctionalComponent1(__VLS_1171, new __VLS_1171({
    round: true,
    icon: "notifications",
}));
var __VLS_1173 = __VLS_1172.apply(void 0, __spreadArray([{
        round: true,
        icon: "notifications",
    }], __VLS_functionalComponentArgsRest(__VLS_1172), false));
var __VLS_1176 = __VLS_1174.slots.default;
var __VLS_1177 = AppBadge_vue_1.default;
// @ts-ignore
var __VLS_1178 = __VLS_asFunctionalComponent1(__VLS_1177, new __VLS_1177({
    label: "99+",
    color: "primary",
    floating: true,
}));
var __VLS_1179 = __VLS_1178.apply(void 0, __spreadArray([{
        label: "99+",
        color: "primary",
        floating: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1178), false));
// @ts-ignore
[];
var __VLS_1174;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
var __VLS_1182 = AppBadge_vue_1.default;
// @ts-ignore
var __VLS_1183 = __VLS_asFunctionalComponent1(__VLS_1182, new __VLS_1182({
    label: "Active",
    color: "positive",
}));
var __VLS_1184 = __VLS_1183.apply(void 0, __spreadArray([{
        label: "Active",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_1183), false));
// @ts-ignore
[];
var __VLS_1157;
// @ts-ignore
[];
var __VLS_1043;
var __VLS_1187;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_1188 = __VLS_asFunctionalComponent1(__VLS_1187, new __VLS_1187({
    name: "lists",
}));
var __VLS_1189 = __VLS_1188.apply(void 0, __spreadArray([{
        name: "lists",
    }], __VLS_functionalComponentArgsRest(__VLS_1188), false));
var __VLS_1192 = __VLS_1190.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1193 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1194 = __VLS_asFunctionalComponent1(__VLS_1193, new __VLS_1193({
    name: "AppList",
    description: "List container component",
    props: (__VLS_ctx.appListProps),
}));
var __VLS_1195 = __VLS_1194.apply(void 0, __spreadArray([{
        name: "AppList",
        description: "List container component",
        props: (__VLS_ctx.appListProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1194), false));
var __VLS_1198 = __VLS_1196.slots.default;
var __VLS_1199 = AppList_vue_1.default || AppList_vue_1.default;
// @ts-ignore
var __VLS_1200 = __VLS_asFunctionalComponent1(__VLS_1199, new __VLS_1199({
    bordered: true,
    separator: true,
}));
var __VLS_1201 = __VLS_1200.apply(void 0, __spreadArray([{
        bordered: true,
        separator: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1200), false));
var __VLS_1204 = __VLS_1202.slots.default;
var __VLS_1205 = ListItem_vue_1.default || ListItem_vue_1.default;
// @ts-ignore
var __VLS_1206 = __VLS_asFunctionalComponent1(__VLS_1205, new __VLS_1205({
    clickable: true,
}));
var __VLS_1207 = __VLS_1206.apply(void 0, __spreadArray([{
        clickable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1206), false));
var __VLS_1210 = __VLS_1208.slots.default;
var __VLS_1211;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1212 = __VLS_asFunctionalComponent1(__VLS_1211, new __VLS_1211({
    avatar: true,
}));
var __VLS_1213 = __VLS_1212.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1212), false));
var __VLS_1216 = __VLS_1214.slots.default;
var __VLS_1217;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_1218 = __VLS_asFunctionalComponent1(__VLS_1217, new __VLS_1217({
    color: "primary",
    textColor: "white",
}));
var __VLS_1219 = __VLS_1218.apply(void 0, __spreadArray([{
        color: "primary",
        textColor: "white",
    }], __VLS_functionalComponentArgsRest(__VLS_1218), false));
var __VLS_1222 = __VLS_1220.slots.default;
// @ts-ignore
[appListProps,];
var __VLS_1220;
// @ts-ignore
[];
var __VLS_1214;
var __VLS_1223;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1224 = __VLS_asFunctionalComponent1(__VLS_1223, new __VLS_1223({}));
var __VLS_1225 = __VLS_1224.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1224), false));
var __VLS_1228 = __VLS_1226.slots.default;
var __VLS_1229;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_1230 = __VLS_asFunctionalComponent1(__VLS_1229, new __VLS_1229({}));
var __VLS_1231 = __VLS_1230.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1230), false));
var __VLS_1234 = __VLS_1232.slots.default;
// @ts-ignore
[];
var __VLS_1232;
var __VLS_1235;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_1236 = __VLS_asFunctionalComponent1(__VLS_1235, new __VLS_1235({
    caption: true,
}));
var __VLS_1237 = __VLS_1236.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1236), false));
var __VLS_1240 = __VLS_1238.slots.default;
// @ts-ignore
[];
var __VLS_1238;
// @ts-ignore
[];
var __VLS_1226;
// @ts-ignore
[];
var __VLS_1208;
var __VLS_1241 = ListItem_vue_1.default || ListItem_vue_1.default;
// @ts-ignore
var __VLS_1242 = __VLS_asFunctionalComponent1(__VLS_1241, new __VLS_1241({
    clickable: true,
}));
var __VLS_1243 = __VLS_1242.apply(void 0, __spreadArray([{
        clickable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1242), false));
var __VLS_1246 = __VLS_1244.slots.default;
var __VLS_1247;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1248 = __VLS_asFunctionalComponent1(__VLS_1247, new __VLS_1247({
    avatar: true,
}));
var __VLS_1249 = __VLS_1248.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1248), false));
var __VLS_1252 = __VLS_1250.slots.default;
var __VLS_1253;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_1254 = __VLS_asFunctionalComponent1(__VLS_1253, new __VLS_1253({
    color: "secondary",
    textColor: "white",
}));
var __VLS_1255 = __VLS_1254.apply(void 0, __spreadArray([{
        color: "secondary",
        textColor: "white",
    }], __VLS_functionalComponentArgsRest(__VLS_1254), false));
var __VLS_1258 = __VLS_1256.slots.default;
// @ts-ignore
[];
var __VLS_1256;
// @ts-ignore
[];
var __VLS_1250;
var __VLS_1259;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1260 = __VLS_asFunctionalComponent1(__VLS_1259, new __VLS_1259({}));
var __VLS_1261 = __VLS_1260.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1260), false));
var __VLS_1264 = __VLS_1262.slots.default;
var __VLS_1265;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_1266 = __VLS_asFunctionalComponent1(__VLS_1265, new __VLS_1265({}));
var __VLS_1267 = __VLS_1266.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1266), false));
var __VLS_1270 = __VLS_1268.slots.default;
// @ts-ignore
[];
var __VLS_1268;
var __VLS_1271;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_1272 = __VLS_asFunctionalComponent1(__VLS_1271, new __VLS_1271({
    caption: true,
}));
var __VLS_1273 = __VLS_1272.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1272), false));
var __VLS_1276 = __VLS_1274.slots.default;
// @ts-ignore
[];
var __VLS_1274;
// @ts-ignore
[];
var __VLS_1262;
// @ts-ignore
[];
var __VLS_1244;
var __VLS_1277 = ListItem_vue_1.default || ListItem_vue_1.default;
// @ts-ignore
var __VLS_1278 = __VLS_asFunctionalComponent1(__VLS_1277, new __VLS_1277({
    clickable: true,
}));
var __VLS_1279 = __VLS_1278.apply(void 0, __spreadArray([{
        clickable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1278), false));
var __VLS_1282 = __VLS_1280.slots.default;
var __VLS_1283;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1284 = __VLS_asFunctionalComponent1(__VLS_1283, new __VLS_1283({
    avatar: true,
}));
var __VLS_1285 = __VLS_1284.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1284), false));
var __VLS_1288 = __VLS_1286.slots.default;
var __VLS_1289;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_1290 = __VLS_asFunctionalComponent1(__VLS_1289, new __VLS_1289({
    color: "positive",
    textColor: "white",
}));
var __VLS_1291 = __VLS_1290.apply(void 0, __spreadArray([{
        color: "positive",
        textColor: "white",
    }], __VLS_functionalComponentArgsRest(__VLS_1290), false));
var __VLS_1294 = __VLS_1292.slots.default;
// @ts-ignore
[];
var __VLS_1292;
// @ts-ignore
[];
var __VLS_1286;
var __VLS_1295;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1296 = __VLS_asFunctionalComponent1(__VLS_1295, new __VLS_1295({}));
var __VLS_1297 = __VLS_1296.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1296), false));
var __VLS_1300 = __VLS_1298.slots.default;
var __VLS_1301;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_1302 = __VLS_asFunctionalComponent1(__VLS_1301, new __VLS_1301({}));
var __VLS_1303 = __VLS_1302.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1302), false));
var __VLS_1306 = __VLS_1304.slots.default;
// @ts-ignore
[];
var __VLS_1304;
var __VLS_1307;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_1308 = __VLS_asFunctionalComponent1(__VLS_1307, new __VLS_1307({
    caption: true,
}));
var __VLS_1309 = __VLS_1308.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1308), false));
var __VLS_1312 = __VLS_1310.slots.default;
// @ts-ignore
[];
var __VLS_1310;
// @ts-ignore
[];
var __VLS_1298;
// @ts-ignore
[];
var __VLS_1280;
// @ts-ignore
[];
var __VLS_1202;
// @ts-ignore
[];
var __VLS_1196;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1313 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1314 = __VLS_asFunctionalComponent1(__VLS_1313, new __VLS_1313({
    name: "ListItem",
    description: "List item with various layouts",
    props: (__VLS_ctx.listItemProps),
}));
var __VLS_1315 = __VLS_1314.apply(void 0, __spreadArray([{
        name: "ListItem",
        description: "List item with various layouts",
        props: (__VLS_ctx.listItemProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1314), false));
var __VLS_1318 = __VLS_1316.slots.default;
var __VLS_1319 = AppList_vue_1.default || AppList_vue_1.default;
// @ts-ignore
var __VLS_1320 = __VLS_asFunctionalComponent1(__VLS_1319, new __VLS_1319({
    bordered: true,
}));
var __VLS_1321 = __VLS_1320.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1320), false));
var __VLS_1324 = __VLS_1322.slots.default;
var __VLS_1325 = ListItem_vue_1.default || ListItem_vue_1.default;
// @ts-ignore
var __VLS_1326 = __VLS_asFunctionalComponent1(__VLS_1325, new __VLS_1325({
    clickable: true,
}));
var __VLS_1327 = __VLS_1326.apply(void 0, __spreadArray([{
        clickable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1326), false));
var __VLS_1330 = __VLS_1328.slots.default;
var __VLS_1331;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1332 = __VLS_asFunctionalComponent1(__VLS_1331, new __VLS_1331({
    avatar: true,
}));
var __VLS_1333 = __VLS_1332.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1332), false));
var __VLS_1336 = __VLS_1334.slots.default;
var __VLS_1337;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1338 = __VLS_asFunctionalComponent1(__VLS_1337, new __VLS_1337({
    name: "folder",
    color: "primary",
}));
var __VLS_1339 = __VLS_1338.apply(void 0, __spreadArray([{
        name: "folder",
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_1338), false));
// @ts-ignore
[listItemProps,];
var __VLS_1334;
var __VLS_1342;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1343 = __VLS_asFunctionalComponent1(__VLS_1342, new __VLS_1342({}));
var __VLS_1344 = __VLS_1343.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1343), false));
var __VLS_1347 = __VLS_1345.slots.default;
// @ts-ignore
[];
var __VLS_1345;
var __VLS_1348;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1349 = __VLS_asFunctionalComponent1(__VLS_1348, new __VLS_1348({
    side: true,
}));
var __VLS_1350 = __VLS_1349.apply(void 0, __spreadArray([{
        side: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1349), false));
var __VLS_1353 = __VLS_1351.slots.default;
var __VLS_1354;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1355 = __VLS_asFunctionalComponent1(__VLS_1354, new __VLS_1354({
    name: "chevron_right",
}));
var __VLS_1356 = __VLS_1355.apply(void 0, __spreadArray([{
        name: "chevron_right",
    }], __VLS_functionalComponentArgsRest(__VLS_1355), false));
// @ts-ignore
[];
var __VLS_1351;
// @ts-ignore
[];
var __VLS_1328;
var __VLS_1359 = ListItem_vue_1.default || ListItem_vue_1.default;
// @ts-ignore
var __VLS_1360 = __VLS_asFunctionalComponent1(__VLS_1359, new __VLS_1359({
    clickable: true,
    active: true,
}));
var __VLS_1361 = __VLS_1360.apply(void 0, __spreadArray([{
        clickable: true,
        active: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1360), false));
var __VLS_1364 = __VLS_1362.slots.default;
var __VLS_1365;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1366 = __VLS_asFunctionalComponent1(__VLS_1365, new __VLS_1365({
    avatar: true,
}));
var __VLS_1367 = __VLS_1366.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1366), false));
var __VLS_1370 = __VLS_1368.slots.default;
var __VLS_1371;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1372 = __VLS_asFunctionalComponent1(__VLS_1371, new __VLS_1371({
    name: "star",
    color: "warning",
}));
var __VLS_1373 = __VLS_1372.apply(void 0, __spreadArray([{
        name: "star",
        color: "warning",
    }], __VLS_functionalComponentArgsRest(__VLS_1372), false));
// @ts-ignore
[];
var __VLS_1368;
var __VLS_1376;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1377 = __VLS_asFunctionalComponent1(__VLS_1376, new __VLS_1376({}));
var __VLS_1378 = __VLS_1377.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1377), false));
var __VLS_1381 = __VLS_1379.slots.default;
// @ts-ignore
[];
var __VLS_1379;
// @ts-ignore
[];
var __VLS_1362;
var __VLS_1382 = ListItem_vue_1.default || ListItem_vue_1.default;
// @ts-ignore
var __VLS_1383 = __VLS_asFunctionalComponent1(__VLS_1382, new __VLS_1382({
    disable: true,
}));
var __VLS_1384 = __VLS_1383.apply(void 0, __spreadArray([{
        disable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1383), false));
var __VLS_1387 = __VLS_1385.slots.default;
var __VLS_1388;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1389 = __VLS_asFunctionalComponent1(__VLS_1388, new __VLS_1388({
    avatar: true,
}));
var __VLS_1390 = __VLS_1389.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1389), false));
var __VLS_1393 = __VLS_1391.slots.default;
var __VLS_1394;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1395 = __VLS_asFunctionalComponent1(__VLS_1394, new __VLS_1394({
    name: "block",
}));
var __VLS_1396 = __VLS_1395.apply(void 0, __spreadArray([{
        name: "block",
    }], __VLS_functionalComponentArgsRest(__VLS_1395), false));
// @ts-ignore
[];
var __VLS_1391;
var __VLS_1399;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_1400 = __VLS_asFunctionalComponent1(__VLS_1399, new __VLS_1399({}));
var __VLS_1401 = __VLS_1400.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1400), false));
var __VLS_1404 = __VLS_1402.slots.default;
// @ts-ignore
[];
var __VLS_1402;
// @ts-ignore
[];
var __VLS_1385;
// @ts-ignore
[];
var __VLS_1322;
// @ts-ignore
[];
var __VLS_1316;
// @ts-ignore
[];
var __VLS_1190;
var __VLS_1405;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_1406 = __VLS_asFunctionalComponent1(__VLS_1405, new __VLS_1405({
    name: "media",
}));
var __VLS_1407 = __VLS_1406.apply(void 0, __spreadArray([{
        name: "media",
    }], __VLS_functionalComponentArgsRest(__VLS_1406), false));
var __VLS_1410 = __VLS_1408.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1411 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1412 = __VLS_asFunctionalComponent1(__VLS_1411, new __VLS_1411({
    name: "AppImage",
    description: "Image with loading state",
    props: (__VLS_ctx.appImageProps),
}));
var __VLS_1413 = __VLS_1412.apply(void 0, __spreadArray([{
        name: "AppImage",
        description: "Image with loading state",
        props: (__VLS_ctx.appImageProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1412), false));
var __VLS_1416 = __VLS_1414.slots.default;
var __VLS_1417 = AppImage_vue_1.default;
// @ts-ignore
var __VLS_1418 = __VLS_asFunctionalComponent1(__VLS_1417, new __VLS_1417(__assign({ src: "https://cdn.quasar.dev/img/mountains.jpg", alt: "Mountains" }, { style: {} })));
var __VLS_1419 = __VLS_1418.apply(void 0, __spreadArray([__assign({ src: "https://cdn.quasar.dev/img/mountains.jpg", alt: "Mountains" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_1418), false));
// @ts-ignore
[appImageProps,];
var __VLS_1414;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1422 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1423 = __VLS_asFunctionalComponent1(__VLS_1422, new __VLS_1422({
    name: "AppVideo",
    description: "Video player component",
    props: (__VLS_ctx.appVideoProps),
}));
var __VLS_1424 = __VLS_1423.apply(void 0, __spreadArray([{
        name: "AppVideo",
        description: "Video player component",
        props: (__VLS_ctx.appVideoProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1423), false));
var __VLS_1427 = __VLS_1425.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
// @ts-ignore
[appVideoProps,];
var __VLS_1425;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_1428 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1429 = __VLS_asFunctionalComponent1(__VLS_1428, new __VLS_1428({
    name: "AppCarousel",
    description: "Image/content carousel",
    props: (__VLS_ctx.appCarouselProps),
}));
var __VLS_1430 = __VLS_1429.apply(void 0, __spreadArray([{
        name: "AppCarousel",
        description: "Image/content carousel",
        props: (__VLS_ctx.appCarouselProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1429), false));
var __VLS_1433 = __VLS_1431.slots.default;
var __VLS_1434 = AppCarousel_vue_1.default || AppCarousel_vue_1.default;
// @ts-ignore
var __VLS_1435 = __VLS_asFunctionalComponent1(__VLS_1434, new __VLS_1434(__assign({ modelValue: (__VLS_ctx.carouselSlide), animated: true, arrows: true, navigation: true, infinite: true, autoplay: true, height: "250px" }, { class: "rounded-borders" })));
var __VLS_1436 = __VLS_1435.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.carouselSlide), animated: true, arrows: true, navigation: true, infinite: true, autoplay: true, height: "250px" }, { class: "rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_1435), false));
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
var __VLS_1439 = __VLS_1437.slots.default;
for (var _h = 0, _j = __VLS_vFor((__VLS_ctx.carouselSlides)); _h < _j.length; _h++) {
    var _k = _j[_h], slide = _k[0], i = _k[1];
    var __VLS_1440 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCarouselSlide | typeof __VLS_components.QCarouselSlide | typeof __VLS_components.qCarouselSlide | typeof __VLS_components.QCarouselSlide} */
    qCarouselSlide;
    // @ts-ignore
    var __VLS_1441 = __VLS_asFunctionalComponent1(__VLS_1440, new __VLS_1440({
        key: (i),
        name: (i),
        imgSrc: (slide.src),
    }));
    var __VLS_1442 = __VLS_1441.apply(void 0, __spreadArray([{
            key: (i),
            name: (i),
            imgSrc: (slide.src),
        }], __VLS_functionalComponentArgsRest(__VLS_1441), false));
    var __VLS_1445 = __VLS_1443.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "absolute-bottom text-center q-pa-md bg-dark-2" }));
    /** @type {__VLS_StyleScopedClasses['absolute-bottom']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-dark-2']} */ ;
    (slide.title);
    // @ts-ignore
    [appCarouselProps, carouselSlide, carouselSlides,];
    var __VLS_1443;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_1437;
// @ts-ignore
[];
var __VLS_1431;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_1446 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1447 = __VLS_asFunctionalComponent1(__VLS_1446, new __VLS_1446({
    name: "AppParallax",
    description: "Parallax scrolling effect",
    props: (__VLS_ctx.appParallaxProps),
}));
var __VLS_1448 = __VLS_1447.apply(void 0, __spreadArray([{
        name: "AppParallax",
        description: "Parallax scrolling effect",
        props: (__VLS_ctx.appParallaxProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1447), false));
var __VLS_1451 = __VLS_1449.slots.default;
var __VLS_1452 = AppParallax_vue_1.default || AppParallax_vue_1.default;
// @ts-ignore
var __VLS_1453 = __VLS_asFunctionalComponent1(__VLS_1452, new __VLS_1452({
    src: "https://cdn.quasar.dev/img/parallax2.jpg",
    height: (200),
}));
var __VLS_1454 = __VLS_1453.apply(void 0, __spreadArray([{
        src: "https://cdn.quasar.dev/img/parallax2.jpg",
        height: (200),
    }], __VLS_functionalComponentArgsRest(__VLS_1453), false));
var __VLS_1457 = __VLS_1455.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-white text-center" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
// @ts-ignore
[appParallaxProps,];
var __VLS_1455;
// @ts-ignore
[];
var __VLS_1449;
// @ts-ignore
[];
var __VLS_1408;
var __VLS_1458;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_1459 = __VLS_asFunctionalComponent1(__VLS_1458, new __VLS_1458({
    name: "pickers",
}));
var __VLS_1460 = __VLS_1459.apply(void 0, __spreadArray([{
        name: "pickers",
    }], __VLS_functionalComponentArgsRest(__VLS_1459), false));
var __VLS_1463 = __VLS_1461.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1464 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1465 = __VLS_asFunctionalComponent1(__VLS_1464, new __VLS_1464({
    name: "DatePicker",
    description: "Date selection picker (wraps QDate)",
    props: (__VLS_ctx.datePickerProps),
}));
var __VLS_1466 = __VLS_1465.apply(void 0, __spreadArray([{
        name: "DatePicker",
        description: "Date selection picker (wraps QDate)",
        props: (__VLS_ctx.datePickerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1465), false));
var __VLS_1469 = __VLS_1467.slots.default;
var __VLS_1470 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_1471 = __VLS_asFunctionalComponent1(__VLS_1470, new __VLS_1470({
    modelValue: (__VLS_ctx.dateValue),
}));
var __VLS_1472 = __VLS_1471.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dateValue),
    }], __VLS_functionalComponentArgsRest(__VLS_1471), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
((_e = __VLS_ctx.dateValue) !== null && _e !== void 0 ? _e : '(chưa chọn)');
// @ts-ignore
[datePickerProps, dateValue, dateValue,];
var __VLS_1467;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1475 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1476 = __VLS_asFunctionalComponent1(__VLS_1475, new __VLS_1475({
    name: "TimePicker",
    description: "Time selection picker (wraps QTime)",
    props: (__VLS_ctx.timePickerProps),
}));
var __VLS_1477 = __VLS_1476.apply(void 0, __spreadArray([{
        name: "TimePicker",
        description: "Time selection picker (wraps QTime)",
        props: (__VLS_ctx.timePickerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1476), false));
var __VLS_1480 = __VLS_1478.slots.default;
var __VLS_1481 = TimePicker_vue_1.default;
// @ts-ignore
var __VLS_1482 = __VLS_asFunctionalComponent1(__VLS_1481, new __VLS_1481({
    modelValue: (__VLS_ctx.timeValue),
}));
var __VLS_1483 = __VLS_1482.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.timeValue),
    }], __VLS_functionalComponentArgsRest(__VLS_1482), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
((_f = __VLS_ctx.timeValue) !== null && _f !== void 0 ? _f : '(chưa chọn)');
// @ts-ignore
[timePickerProps, timeValue, timeValue,];
var __VLS_1478;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1486 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1487 = __VLS_asFunctionalComponent1(__VLS_1486, new __VLS_1486({
    name: "ColorPicker",
    description: "Color selection picker",
    props: (__VLS_ctx.colorPickerProps),
}));
var __VLS_1488 = __VLS_1487.apply(void 0, __spreadArray([{
        name: "ColorPicker",
        description: "Color selection picker",
        props: (__VLS_ctx.colorPickerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1487), false));
var __VLS_1491 = __VLS_1489.slots.default;
var __VLS_1492 = ColorPicker_vue_1.default;
// @ts-ignore
var __VLS_1493 = __VLS_asFunctionalComponent1(__VLS_1492, new __VLS_1492({
    modelValue: (__VLS_ctx.colorValue),
}));
var __VLS_1494 = __VLS_1493.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.colorValue),
    }], __VLS_functionalComponentArgsRest(__VLS_1493), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm q-pa-sm rounded-borders" }, { style: ({ backgroundColor: __VLS_ctx.colorValue || '#1976D2' }) }));
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
(__VLS_ctx.colorValue);
// @ts-ignore
[colorPickerProps, colorValue, colorValue, colorValue,];
var __VLS_1489;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1497 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1498 = __VLS_asFunctionalComponent1(__VLS_1497, new __VLS_1497({
    name: "FilePicker",
    description: "File upload picker",
    props: (__VLS_ctx.filePickerProps),
}));
var __VLS_1499 = __VLS_1498.apply(void 0, __spreadArray([{
        name: "FilePicker",
        description: "File upload picker",
        props: (__VLS_ctx.filePickerProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1498), false));
var __VLS_1502 = __VLS_1500.slots.default;
var __VLS_1503 = FilePicker_vue_1.default;
// @ts-ignore
var __VLS_1504 = __VLS_asFunctionalComponent1(__VLS_1503, new __VLS_1503({
    modelValue: (__VLS_ctx.fileValue),
    label: "Chọn tệp",
    accept: ".pdf,.doc,.docx",
}));
var __VLS_1505 = __VLS_1504.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.fileValue),
        label: "Chọn tệp",
        accept: ".pdf,.doc,.docx",
    }], __VLS_functionalComponentArgsRest(__VLS_1504), false));
// @ts-ignore
[filePickerProps, fileValue,];
var __VLS_1500;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_1508 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1509 = __VLS_asFunctionalComponent1(__VLS_1508, new __VLS_1508({
    name: "AppEditor",
    description: "Rich text editor",
    props: (__VLS_ctx.appEditorProps),
}));
var __VLS_1510 = __VLS_1509.apply(void 0, __spreadArray([{
        name: "AppEditor",
        description: "Rich text editor",
        props: (__VLS_ctx.appEditorProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1509), false));
var __VLS_1513 = __VLS_1511.slots.default;
var __VLS_1514 = AppEditor_vue_1.default;
// @ts-ignore
var __VLS_1515 = __VLS_asFunctionalComponent1(__VLS_1514, new __VLS_1514({
    modelValue: (__VLS_ctx.editorValue),
    minHeight: "150px",
}));
var __VLS_1516 = __VLS_1515.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editorValue),
        minHeight: "150px",
    }], __VLS_functionalComponentArgsRest(__VLS_1515), false));
// @ts-ignore
[appEditorProps, editorValue,];
var __VLS_1511;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1519 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1520 = __VLS_asFunctionalComponent1(__VLS_1519, new __VLS_1519({
    name: "ScrollArea",
    description: "Custom scrollbar area",
    props: (__VLS_ctx.scrollAreaProps),
}));
var __VLS_1521 = __VLS_1520.apply(void 0, __spreadArray([{
        name: "ScrollArea",
        description: "Custom scrollbar area",
        props: (__VLS_ctx.scrollAreaProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1520), false));
var __VLS_1524 = __VLS_1522.slots.default;
var __VLS_1525 = ScrollArea_vue_1.default || ScrollArea_vue_1.default;
// @ts-ignore
var __VLS_1526 = __VLS_asFunctionalComponent1(__VLS_1525, new __VLS_1525(__assign({ style: {} }, { class: "rounded-borders bg-grey-2" })));
var __VLS_1527 = __VLS_1526.apply(void 0, __spreadArray([__assign({ style: {} }, { class: "rounded-borders bg-grey-2" })], __VLS_functionalComponentArgsRest(__VLS_1526), false));
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
var __VLS_1530 = __VLS_1528.slots.default;
for (var _l = 0, _m = __VLS_vFor((20)); _l < _m.length; _l++) {
    var n = _m[_l][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (n) }, { class: "q-pa-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    (n);
    // @ts-ignore
    [scrollAreaProps,];
}
// @ts-ignore
[];
var __VLS_1528;
// @ts-ignore
[];
var __VLS_1522;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1531 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1532 = __VLS_asFunctionalComponent1(__VLS_1531, new __VLS_1531({
    name: "VirtualScroll",
    description: "Virtual scroll for large lists",
    props: (__VLS_ctx.virtualScrollProps),
}));
var __VLS_1533 = __VLS_1532.apply(void 0, __spreadArray([{
        name: "VirtualScroll",
        description: "Virtual scroll for large lists",
        props: (__VLS_ctx.virtualScrollProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1532), false));
var __VLS_1536 = __VLS_1534.slots.default;
var __VLS_1537 = VirtualScroll_vue_1.default || VirtualScroll_vue_1.default;
// @ts-ignore
var __VLS_1538 = __VLS_asFunctionalComponent1(__VLS_1537, new __VLS_1537(__assign({ items: (__VLS_ctx.virtualItems) }, { style: {} })));
var __VLS_1539 = __VLS_1538.apply(void 0, __spreadArray([__assign({ items: (__VLS_ctx.virtualItems) }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_1538), false));
var __VLS_1542 = __VLS_1540.slots.default;
{
    var __VLS_1543 = __VLS_1540.slots.default;
    var item = __VLS_vSlot(__VLS_1543)[0].item;
    var __VLS_1544 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_1545 = __VLS_asFunctionalComponent1(__VLS_1544, new __VLS_1544({
        dense: true,
    }));
    var __VLS_1546 = __VLS_1545.apply(void 0, __spreadArray([{
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_1545), false));
    var __VLS_1549 = __VLS_1547.slots.default;
    var __VLS_1550 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_1551 = __VLS_asFunctionalComponent1(__VLS_1550, new __VLS_1550({}));
    var __VLS_1552 = __VLS_1551.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1551), false));
    var __VLS_1555 = __VLS_1553.slots.default;
    (item);
    // @ts-ignore
    [virtualScrollProps, virtualItems,];
    var __VLS_1553;
    // @ts-ignore
    [];
    var __VLS_1547;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_1540;
// @ts-ignore
[];
var __VLS_1534;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1556 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1557 = __VLS_asFunctionalComponent1(__VLS_1556, new __VLS_1556({
    name: "InfiniteScroll",
    description: "Infinite loading scroll",
    props: (__VLS_ctx.infiniteScrollProps),
}));
var __VLS_1558 = __VLS_1557.apply(void 0, __spreadArray([{
        name: "InfiniteScroll",
        description: "Infinite loading scroll",
        props: (__VLS_ctx.infiniteScrollProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1557), false));
var __VLS_1561 = __VLS_1559.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ style: {} }, { class: "rounded-borders bg-grey-2" }));
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
var __VLS_1562 = InfiniteScroll_vue_1.default || InfiniteScroll_vue_1.default;
// @ts-ignore
var __VLS_1563 = __VLS_asFunctionalComponent1(__VLS_1562, new __VLS_1562(__assign({ 'onLoad': {} }, { offset: (100) })));
var __VLS_1564 = __VLS_1563.apply(void 0, __spreadArray([__assign({ 'onLoad': {} }, { offset: (100) })], __VLS_functionalComponentArgsRest(__VLS_1563), false));
var __VLS_1567;
var __VLS_1568 = ({ load: {} },
    { onLoad: (__VLS_ctx.onInfiniteLoad) });
var __VLS_1569 = __VLS_1565.slots.default;
for (var _o = 0, _p = __VLS_vFor((__VLS_ctx.infiniteItems)); _o < _p.length; _o++) {
    var item = _p[_o][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (item) }, { class: "q-pa-sm border-bottom" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-bottom']} */ ;
    (item);
    // @ts-ignore
    [infiniteScrollProps, onInfiniteLoad, infiniteItems,];
}
{
    var __VLS_1570 = __VLS_1565.slots.loading;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_1571 = AppSpinner_vue_1.default;
    // @ts-ignore
    var __VLS_1572 = __VLS_asFunctionalComponent1(__VLS_1571, new __VLS_1571({
        size: "sm",
    }));
    var __VLS_1573 = __VLS_1572.apply(void 0, __spreadArray([{
            size: "sm",
        }], __VLS_functionalComponentArgsRest(__VLS_1572), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_1565;
var __VLS_1566;
// @ts-ignore
[];
var __VLS_1559;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_1576 = ComponentCard_vue_1.default || ComponentCard_vue_1.default;
// @ts-ignore
var __VLS_1577 = __VLS_asFunctionalComponent1(__VLS_1576, new __VLS_1576({
    name: "Timeline / TimelineEntry",
    description: "Timeline display",
    props: (__VLS_ctx.timelineProps),
}));
var __VLS_1578 = __VLS_1577.apply(void 0, __spreadArray([{
        name: "Timeline / TimelineEntry",
        description: "Timeline display",
        props: (__VLS_ctx.timelineProps),
    }], __VLS_functionalComponentArgsRest(__VLS_1577), false));
var __VLS_1581 = __VLS_1579.slots.default;
var __VLS_1582 = Timeline_vue_1.default || Timeline_vue_1.default;
// @ts-ignore
var __VLS_1583 = __VLS_asFunctionalComponent1(__VLS_1582, new __VLS_1582({
    color: "primary",
}));
var __VLS_1584 = __VLS_1583.apply(void 0, __spreadArray([{
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_1583), false));
var __VLS_1587 = __VLS_1585.slots.default;
var __VLS_1588 = TimelineEntry_vue_1.default || TimelineEntry_vue_1.default;
// @ts-ignore
var __VLS_1589 = __VLS_asFunctionalComponent1(__VLS_1588, new __VLS_1588({
    title: "Bước 1",
    subtitle: "09:00",
}));
var __VLS_1590 = __VLS_1589.apply(void 0, __spreadArray([{
        title: "Bước 1",
        subtitle: "09:00",
    }], __VLS_functionalComponentArgsRest(__VLS_1589), false));
var __VLS_1593 = __VLS_1591.slots.default;
// @ts-ignore
[timelineProps,];
var __VLS_1591;
var __VLS_1594 = TimelineEntry_vue_1.default || TimelineEntry_vue_1.default;
// @ts-ignore
var __VLS_1595 = __VLS_asFunctionalComponent1(__VLS_1594, new __VLS_1594({
    title: "Bước 2",
    subtitle: "12:00",
    color: "positive",
}));
var __VLS_1596 = __VLS_1595.apply(void 0, __spreadArray([{
        title: "Bước 2",
        subtitle: "12:00",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_1595), false));
var __VLS_1599 = __VLS_1597.slots.default;
// @ts-ignore
[];
var __VLS_1597;
var __VLS_1600 = TimelineEntry_vue_1.default || TimelineEntry_vue_1.default;
// @ts-ignore
var __VLS_1601 = __VLS_asFunctionalComponent1(__VLS_1600, new __VLS_1600({
    title: "Bước 3",
    subtitle: "15:00",
    color: "info",
}));
var __VLS_1602 = __VLS_1601.apply(void 0, __spreadArray([{
        title: "Bước 3",
        subtitle: "15:00",
        color: "info",
    }], __VLS_functionalComponentArgsRest(__VLS_1601), false));
var __VLS_1605 = __VLS_1603.slots.default;
// @ts-ignore
[];
var __VLS_1603;
// @ts-ignore
[];
var __VLS_1585;
// @ts-ignore
[];
var __VLS_1579;
// @ts-ignore
[];
var __VLS_1461;
// @ts-ignore
[];
var __VLS_24;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
