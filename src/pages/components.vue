<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="flex items-center q-mb-lg">
      <q-icon
        name="widgets"
        size="32px"
        color="primary"
        class="q-mr-sm"
      />
      <h1 class="text-h4 text-weight-bold q-my-none">
        UI Component Library
      </h1>
    </div>

    <!-- Tab Navigation -->
    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
      no-caps
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        :label="tab.label"
      />
    </q-tabs>

    <q-separator />

    <!-- Tab Panels -->
    <q-tab-panels
      v-model="activeTab"
      animated
      class="q-mt-md"
    >
      <!-- Buttons Tab -->
      <q-tab-panel name="buttons">
        <div class="row q-col-gutter-lg">
          <!-- AppButton -->
          <div class="col-12">
            <ComponentCard
              name="AppButton"
              description="Standardized button wrapping q-btn with Vietnamese defaults"
              :props="appButtonProps"
            >
              <div class="q-gutter-md">
                <div class="text-subtitle2 q-mb-sm">Variants</div>
                <div class="flex flex-wrap q-gutter-sm">
                  <AppButton variant="filled" label="Filled" />
                  <AppButton variant="outlined" label="Outlined" />
                  <AppButton variant="flat" label="Flat" />
                  <AppButton variant="text" label="Text" />
                </div>

                <div class="text-subtitle2 q-mb-sm q-mt-md">Colors</div>
                <div class="flex flex-wrap q-gutter-sm">
                  <AppButton color="primary" label="Primary" />
                  <AppButton color="secondary" label="Secondary" />
                  <AppButton color="positive" label="Positive" />
                  <AppButton color="negative" label="Negative" />
                  <AppButton color="warning" label="Warning" />
                  <AppButton color="info" label="Info" />
                </div>

                <div class="text-subtitle2 q-mb-sm q-mt-md">States</div>
                <div class="flex flex-wrap q-gutter-sm">
                  <AppButton label="Loading" loading />
                  <AppButton label="Disabled" disable />
                  <AppButton icon="add" label="With Icon" />
                  <AppButton icon="save" round />
                </div>

                <div class="text-subtitle2 q-mb-sm q-mt-md">Sizes</div>
                <div class="flex flex-wrap items-center q-gutter-sm">
                  <AppButton size="xs" label="XS" />
                  <AppButton size="sm" label="SM" />
                  <AppButton size="md" label="MD" />
                  <AppButton size="lg" label="LG" />
                  <AppButton size="xl" label="XL" />
                </div>
              </div>
            </ComponentCard>
          </div>

          <!-- IconButton -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="IconButton"
              description="Round icon button for actions"
              :props="iconButtonProps"
            >
              <div class="flex flex-wrap q-gutter-sm">
                <IconButton icon="edit" />
                <IconButton icon="delete" color="negative" />
                <IconButton icon="visibility" color="info" />
                <IconButton icon="favorite" color="pink" />
                <IconButton icon="share" color="positive" />
                <IconButton icon="settings" loading />
              </div>
            </ComponentCard>
          </div>

          <!-- ButtonGroup -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ButtonGroup"
              description="Group of buttons as a unit"
              :props="buttonGroupProps"
            >
              <ButtonGroup outline>
                <AppButton variant="outlined" icon="format_bold" />
                <AppButton variant="outlined" icon="format_italic" />
                <AppButton variant="outlined" icon="format_underlined" />
              </ButtonGroup>
            </ComponentCard>
          </div>

          <!-- ButtonToggle -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ButtonToggle"
              description="Toggle button group for selection"
              :props="buttonToggleProps"
            >
              <ButtonToggle
                v-model="toggleValue"
                :options="[
                  { label: 'Trái', value: 'left', icon: 'format_align_left' },
                  { label: 'Giữa', value: 'center', icon: 'format_align_center' },
                  { label: 'Phải', value: 'right', icon: 'format_align_right' }
                ]"
              />
              <div class="text-caption q-mt-sm">Giá trị: {{ toggleValue }}</div>
            </ComponentCard>
          </div>

          <!-- ButtonDropdown -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ButtonDropdown"
              description="Button with dropdown menu"
              :props="buttonDropdownProps"
            >
              <ButtonDropdown label="Tùy chọn" icon="arrow_drop_down">
                <q-list>
                  <q-item clickable @click="() => {}">
                    <q-item-section avatar><q-icon name="edit" /></q-item-section>
                    <q-item-section>Chỉnh sửa</q-item-section>
                  </q-item>
                  <q-item clickable @click="() => {}">
                    <q-item-section avatar><q-icon name="delete" /></q-item-section>
                    <q-item-section>Xóa</q-item-section>
                  </q-item>
                </q-list>
              </ButtonDropdown>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Inputs Tab -->
      <q-tab-panel name="inputs">
        <div class="row q-col-gutter-lg">
          <!-- AppInput -->
          <div class="col-12">
            <ComponentCard
              name="AppInput"
              description="Input wrapper with Vietnamese defaults and validation"
              :props="appInputProps"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <AppInput
                    v-model="inputValue"
                    label="Họ và tên"
                    placeholder="Nhập họ tên..."
                    prepend-icon="person"
                    clearable
                  />
                </div>
                <div class="col-12 col-md-4">
                  <AppInput
                    label="Email"
                    type="email"
                    prepend-icon="email"
                    hint="example@domain.com"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <AppInput
                    label="Mật khẩu"
                    type="password"
                    prepend-icon="lock"
                    required
                  />
                </div>
                <div class="col-12 col-md-4">
                  <AppInput
                    label="Số điện thoại"
                    mask="#### ### ###"
                    prepend-icon="phone"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <AppInput
                    label="Filled Style"
                    filled
                    :outlined="false"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <AppInput
                    label="With Error"
                    error-message="Trường này không hợp lệ"
                  />
                </div>
              </div>
            </ComponentCard>
          </div>

          <!-- AppSelect -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppSelect"
              description="Select dropdown with search and multiple selection"
              :props="appSelectProps"
            >
              <div class="q-gutter-md">
                <AppSelect
                  v-model="selectValue"
                  label="Thành phố"
                  :options="['Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Cần Thơ']"
                />
                <AppSelect
                  v-model="multiSelectValue"
                  label="Kỹ năng"
                  :options="['Vue', 'React', 'Angular', 'TypeScript', 'Node.js']"
                  multiple
                  use-chips
                />
              </div>
            </ComponentCard>
          </div>

          <!-- AppTextarea -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppTextarea"
              description="Multiline text input with autogrow"
              :props="appTextareaProps"
            >
              <AppTextarea
                v-model="textareaValue"
                label="Mô tả"
                placeholder="Nhập mô tả chi tiết..."
                autogrow
                counter
                :maxlength="500"
              />
            </ComponentCard>
          </div>

          <!-- AppCheckbox & AppToggle -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppCheckbox"
              description="Checkbox input with label"
              :props="appCheckboxProps"
            >
              <div class="q-gutter-sm">
                <AppCheckbox v-model="checkbox1" label="Đồng ý điều khoản" />
                <AppCheckbox v-model="checkbox2" label="Nhận thông báo" color="positive" />
                <AppCheckbox label="Disabled" disable />
              </div>
            </ComponentCard>
          </div>

          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppToggle"
              description="Toggle switch input"
              :props="appToggleProps"
            >
              <div class="q-gutter-sm">
                <AppToggle v-model="toggle1" label="Chế độ tối" />
                <AppToggle v-model="toggle2" label="Thông báo" color="positive" />
                <AppToggle label="Disabled" disable />
              </div>
            </ComponentCard>
          </div>

          <!-- AppSlider & AppRange -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppSlider"
              description="Single value slider"
              :props="appSliderProps"
            >
              <div class="q-px-md">
                <div class="text-caption q-mb-sm">Âm lượng: {{ sliderValue }}%</div>
                <AppSlider
                  v-model="sliderValue"
                  :min="0"
                  :max="100"
                  label
                  color="primary"
                />
              </div>
            </ComponentCard>
          </div>

          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppRange"
              description="Range slider with min/max values"
              :props="appRangeProps"
            >
              <div class="q-px-md">
                <div class="text-caption q-mb-sm">
                  Giá: {{ rangeValue?.min ?? 0 }} - {{ rangeValue?.max ?? 100 }} triệu
                </div>
                <AppRange
                  v-model="rangeValue"
                  :min="0"
                  :max="100"
                  label
                  color="positive"
                />
              </div>
            </ComponentCard>
          </div>

          <!-- SearchInput -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="SearchInput"
              description="Search input with debounce"
              :props="searchInputProps"
            >
              <SearchInput
                v-model="searchValue"
                placeholder="Tìm kiếm..."
                :debounce="300"
                clearable
              />
              <div class="text-caption q-mt-sm">Giá trị: {{ searchValue }}</div>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Dialogs Tab -->
      <q-tab-panel name="dialogs">
        <div class="row q-col-gutter-lg">
          <!-- AppDialog -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppDialog"
              description="Base dialog wrapper component"
              :props="appDialogProps"
            >
              <AppButton label="Mở Dialog" @click="showAppDialog = true" />
              <AppDialog v-model="showAppDialog">
                <q-card style="min-width: 350px">
                  <q-card-section>
                    <div class="text-h6">AppDialog Demo</div>
                  </q-card-section>
                  <q-card-section>
                    Đây là nội dung của dialog cơ bản.
                  </q-card-section>
                  <q-card-actions align="right">
                    <AppButton variant="flat" label="Đóng" @click="showAppDialog = false" />
                  </q-card-actions>
                </q-card>
              </AppDialog>
            </ComponentCard>
          </div>

          <!-- FormDialog -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="FormDialog"
              description="Dialog with form functionality"
              :props="formDialogProps"
            >
              <AppButton label="Mở Form Dialog" @click="showFormDialog = true" />
              <FormDialog
                v-model="showFormDialog"
                title="Thêm nhân viên"
                @submit="showFormDialog = false"
              >
                <div class="q-gutter-md">
                  <AppInput label="Họ tên" required />
                  <AppInput label="Email" type="email" />
                  <AppSelect
                    label="Phòng ban"
                    :options="['IT', 'HR', 'Sales']"
                  />
                </div>
              </FormDialog>
            </ComponentCard>
          </div>

          <!-- ConfirmDialog -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ConfirmDialog"
              description="Confirmation dialog with actions"
              :props="confirmDialogProps"
            >
              <AppButton label="Hiện xác nhận" color="info" @click="showConfirmDialog = true" />
              <ConfirmDialog
                v-model="showConfirmDialog"
                message="Bạn có chắc chắn muốn thực hiện hành động này?"
                @confirm="showConfirmDialog = false"
              />
            </ComponentCard>
          </div>

          <!-- DeleteDialog -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="DeleteDialog"
              description="Delete confirmation dialog"
              :props="deleteDialogProps"
            >
              <AppButton label="Xóa" color="negative" @click="showDeleteDialog = true" />
              <DeleteDialog
                v-model="showDeleteDialog"
                item-name="Nhân viên ABC"
                @confirm="showDeleteDialog = false"
              />
            </ComponentCard>
          </div>

          <!-- AppMenu -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppMenu"
              description="Dropdown context menu"
              :props="appMenuProps"
            >
              <AppButton label="Click để mở menu">
                <AppMenu
                  :items="[
                    { label: 'Chỉnh sửa', icon: 'edit' },
                    { label: 'Sao chép', icon: 'content_copy' },
                    { label: '', separator: true },
                    { label: 'Xóa', icon: 'delete' }
                  ]"
                />
              </AppButton>
            </ComponentCard>
          </div>

          <!-- AppTooltip -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppTooltip"
              description="Tooltip for hints"
              :props="appTooltipProps"
            >
              <div class="flex q-gutter-md">
                <AppButton label="Hover me">
                  <AppTooltip text="Đây là tooltip" />
                </AppButton>
                <q-icon name="help" size="24px" class="cursor-pointer">
                  <AppTooltip text="Thông tin trợ giúp" />
                </q-icon>
              </div>
            </ComponentCard>
          </div>

          <!-- PopupEdit -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="PopupEdit"
              description="Inline popup editor"
              :props="popupEditProps"
            >
              <div class="text-body1">
                Tên: <span class="text-primary cursor-pointer">{{ editableText }}</span>
                <PopupEdit v-model="editableText" />
              </div>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Feedback Tab -->
      <q-tab-panel name="feedback">
        <div class="row q-col-gutter-lg">
          <!-- AppSpinner -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppSpinner"
              description="Loading spinner indicator"
              :props="appSpinnerProps"
            >
              <div class="flex items-center q-gutter-lg">
                <AppSpinner size="xs" />
                <AppSpinner size="sm" />
                <AppSpinner size="md" />
                <AppSpinner size="lg" color="positive" />
                <AppSpinner size="xl" color="negative" />
              </div>
            </ComponentCard>
          </div>

          <!-- CircularProgress -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="CircularProgress"
              description="Circular progress indicator"
              :props="circularProgressProps"
            >
              <div class="flex items-center q-gutter-lg">
                <CircularProgress indeterminate size="40px" />
                <CircularProgress :value="0.3" size="50px" show-value />
                <CircularProgress :value="0.7" size="60px" color="positive" show-value />
              </div>
            </ComponentCard>
          </div>

          <!-- AppProgress -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppProgress"
              description="Linear progress bar"
              :props="appProgressProps"
            >
              <div class="q-gutter-md">
                <AppProgress indeterminate />
                <AppProgress :value="0.4" color="positive" />
                <AppProgress :value="0.6" stripe color="warning" />
              </div>
            </ComponentCard>
          </div>

          <!-- AppSkeleton -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppSkeleton"
              description="Loading placeholder skeleton"
              :props="appSkeletonProps"
            >
              <div class="q-gutter-sm">
                <AppSkeleton type="text" />
                <AppSkeleton type="text" width="60%" />
                <div class="flex q-gutter-sm">
                  <AppSkeleton type="circle" size="40px" />
                  <div class="flex-grow-1">
                    <AppSkeleton type="text" />
                    <AppSkeleton type="text" width="50%" />
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>

          <!-- EmptyState -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="EmptyState"
              description="Empty state display with icon and text"
              :props="emptyStateProps"
            >
              <EmptyState
                icon="inbox"
                title="Không có dữ liệu"
                subtitle="Chưa có dữ liệu nào được thêm vào"
              />
            </ComponentCard>
          </div>

          <!-- AppBanner -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppBanner"
              description="Banner notification"
              :props="appBannerProps"
            >
              <AppBanner v-model="showBanner" rounded class="bg-info text-white">
                <template #avatar>
                  <q-icon name="info" />
                </template>
                Đây là thông báo banner quan trọng!
                <template #action>
                  <q-btn flat label="Đóng" @click="showBanner = false" />
                </template>
              </AppBanner>
              <AppButton
                v-if="!showBanner"
                label="Hiện Banner"
                @click="showBanner = true"
              />
            </ComponentCard>
          </div>

          <!-- InnerLoading -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="InnerLoading"
              description="Inner loading overlay"
              :props="innerLoadingProps"
            >
              <div class="relative-position" style="height: 100px; border: 1px dashed #ccc">
                <div class="text-center q-pt-lg">Nội dung bên dưới</div>
                <InnerLoading :showing="showInnerLoading" label="Đang tải..." />
              </div>
              <AppButton
                class="q-mt-sm"
                :label="showInnerLoading ? 'Ẩn Loading' : 'Hiện Loading'"
                @click="showInnerLoading = !showInnerLoading"
              />
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Navigation Tab -->
      <q-tab-panel name="navigation">
        <div class="row q-col-gutter-lg">
          <!-- AppTabs -->
          <div class="col-12">
            <ComponentCard
              name="AppTabs / TabPanel"
              description="Tab navigation with panels"
              :props="appTabsProps"
            >
              <AppTabs v-model="demoTab">
                <q-tab name="tab1" label="Tab 1" icon="home" />
                <q-tab name="tab2" label="Tab 2" icon="settings" />
                <q-tab name="tab3" label="Tab 3" icon="person" />
              </AppTabs>
              <q-tab-panels v-model="demoTab" animated class="q-mt-sm">
                <TabPanel name="tab1">Nội dung Tab 1</TabPanel>
                <TabPanel name="tab2">Nội dung Tab 2</TabPanel>
                <TabPanel name="tab3">Nội dung Tab 3</TabPanel>
              </q-tab-panels>
            </ComponentCard>
          </div>

          <!-- AppStepper -->
          <div class="col-12">
            <ComponentCard
              name="AppStepper / StepperStep"
              description="Step-by-step wizard"
              :props="appStepperProps"
            >
              <AppStepper v-model="(stepValue as string | number)" header-nav animated>
                <StepperStep :name="1" title="Bước 1" caption="Thông tin cơ bản" icon="person">
                  Nội dung bước 1
                </StepperStep>
                <StepperStep :name="2" title="Bước 2" caption="Chi tiết" icon="description">
                  Nội dung bước 2
                </StepperStep>
                <StepperStep :name="3" title="Bước 3" caption="Xác nhận" icon="check">
                  Nội dung bước 3
                </StepperStep>
                <template #navigation>
                  <q-stepper-navigation>
                    <AppButton
                      :label="stepValue === 3 ? 'Hoàn tất' : 'Tiếp'"
                      @click="stepValue = Math.min(stepValue + 1, 3)"
                    />
                    <AppButton
                      v-if="stepValue > 1"
                      variant="flat"
                      label="Quay lại"
                      class="q-ml-sm"
                      @click="stepValue--"
                    />
                  </q-stepper-navigation>
                </template>
              </AppStepper>
            </ComponentCard>
          </div>

          <!-- AppPagination -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppPagination"
              description="Pagination control"
              :props="appPaginationProps"
            >
              <AppPagination
                v-model="pageValue"
                :max="10"
                direction-links
                boundary-links
              />
              <div class="text-caption q-mt-sm">Trang: {{ pageValue }}</div>
            </ComponentCard>
          </div>

          <!-- AppBreadcrumbs -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppBreadcrumbs"
              description="Breadcrumb navigation"
              :props="appBreadcrumbsProps"
            >
              <AppBreadcrumbs
                :items="[
                  { label: 'Trang chủ', icon: 'home', to: '/' },
                  { label: 'Danh mục' },
                  { label: 'Trang hiện tại' }
                ]"
              />
            </ComponentCard>
          </div>

          <!-- SidebarItem -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="SidebarItem"
              description="Sidebar navigation item"
              :props="sidebarItemProps"
            >
              <q-list bordered class="rounded-borders" style="max-width: 300px">
                <SidebarItem :item="{ icon: 'home', label: 'Trang chủ', to: '/' }" />
                <SidebarItem :item="{ icon: 'people', label: 'Nhân viên', to: '/employees' }" />
                <SidebarItem :item="{ icon: 'settings', label: 'Cài đặt' }" />
              </q-list>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Layout Tab -->
      <q-tab-panel name="layout">
        <div class="row q-col-gutter-lg">
          <!-- PageHeader -->
          <div class="col-12">
            <ComponentCard
              name="PageHeader"
              description="Page header with title and actions"
              :props="pageHeaderProps"
            >
              <PageHeader
                title="Quản lý nhân viên"
                subtitle="Danh sách tất cả nhân viên trong hệ thống"
                icon="people"
              >
                <template #actions>
                  <AppButton icon="add" label="Thêm mới" />
                </template>
              </PageHeader>
            </ComponentCard>
          </div>

          <!-- SectionHeader -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="SectionHeader"
              description="Section header divider"
              :props="sectionHeaderProps"
            >
              <SectionHeader title="Thông tin cá nhân" icon="person" />
              <div class="q-pa-md bg-grey-2 rounded-borders">
                Nội dung section...
              </div>
            </ComponentCard>
          </div>

          <!-- AppToolbar -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppToolbar"
              description="Toolbar with actions"
              :props="appToolbarProps"
            >
              <AppToolbar class="bg-primary text-white">
                <q-btn flat round dense icon="menu" />
                <q-toolbar-title>Tiêu đề</q-toolbar-title>
                <q-btn flat round dense icon="search" />
                <q-btn flat round dense icon="more_vert" />
              </AppToolbar>
            </ComponentCard>
          </div>

          <!-- AppSeparator -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppSeparator"
              description="Visual separator line"
              :props="appSeparatorProps"
            >
              <div>Nội dung trên</div>
              <AppSeparator spaced />
              <div>Nội dung dưới</div>
            </ComponentCard>
          </div>

          <!-- AppSpace -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppSpace"
              description="Flexible space component"
              :props="appSpaceProps"
            >
              <div class="flex items-center">
                <span>Trái</span>
                <AppSpace />
                <span>Phải</span>
              </div>
            </ComponentCard>
          </div>

          <!-- AppDrawer -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppDrawer"
              description="Side drawer navigation"
              :props="appDrawerProps"
            >
              <AppButton label="Mở Drawer" @click="showDrawer = true" />
              <div class="text-caption q-mt-sm">
                (Demo drawer sẽ hiển thị ở layout chính)
              </div>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Cards Tab -->
      <q-tab-panel name="cards">
        <div class="row q-col-gutter-lg">
          <!-- AppCard -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppCard"
              description="Base card container"
              :props="appCardProps"
            >
              <AppCard bordered>
                <q-card-section>
                  <div class="text-h6">Card Title</div>
                  <div class="text-subtitle2">Subtitle</div>
                </q-card-section>
                <q-card-section>
                  Nội dung card đơn giản.
                </q-card-section>
                <q-card-actions align="right">
                  <AppButton variant="flat" label="Hành động" />
                </q-card-actions>
              </AppCard>
            </ComponentCard>
          </div>

          <!-- InfoCard -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="InfoCard"
              description="Card with icon and info"
              :props="infoCardProps"
            >
              <InfoCard
                title="Thông tin quan trọng"
                subtitle="Mô tả chi tiết về thông tin này"
                icon="info"
                icon-color="info"
              />
            </ComponentCard>
          </div>

          <!-- StatCard -->
          <div class="col-12">
            <ComponentCard
              name="StatCard"
              description="Statistics display card"
              :props="statCardProps"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6 col-md-3">
                  <StatCard
                    label="Tổng nhân viên"
                    value="1,234"
                    icon="people"
                    trend="+5%"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <StatCard
                    label="Doanh thu"
                    value="$52,000"
                    icon="attach_money"
                    icon-bg-color="positive"
                    trend="+12%"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <StatCard
                    label="Đơn hàng"
                    value="856"
                    icon="shopping_cart"
                    icon-bg-color="warning"
                    trend="-3%"
                    :trend-positive="false"
                  />
                </div>
                <div class="col-12 col-sm-6 col-md-3">
                  <StatCard
                    label="Khách hàng"
                    value="2,100"
                    icon="person_add"
                    icon-bg-color="info"
                  />
                </div>
              </div>
            </ComponentCard>
          </div>

          <!-- AppChip -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppChip"
              description="Chip/tag component"
              :props="appChipProps"
            >
              <div class="flex flex-wrap q-gutter-sm">
                <AppChip label="Default" />
                <AppChip label="Primary" color="primary" />
                <AppChip label="Positive" color="positive" />
                <AppChip label="With Icon" icon="star" color="warning" />
                <AppChip label="Removable" removable color="negative" />
                <AppChip label="Outlined" outline color="info" />
              </div>
            </ComponentCard>
          </div>

          <!-- AppBadge -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppBadge"
              description="Badge indicator"
              :props="appBadgeProps"
            >
              <div class="flex items-center q-gutter-lg">
                <q-btn round icon="mail">
                  <AppBadge label="5" color="negative" floating />
                </q-btn>
                <q-btn round icon="notifications">
                  <AppBadge label="99+" color="primary" floating />
                </q-btn>
                <span>
                  Status: <AppBadge label="Active" color="positive" />
                </span>
              </div>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Lists Tab -->
      <q-tab-panel name="lists">
        <div class="row q-col-gutter-lg">
          <!-- AppList -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppList"
              description="List container component"
              :props="appListProps"
            >
              <AppList bordered separator>
                <ListItem clickable>
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white">A</q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Nguyễn Văn A</q-item-label>
                    <q-item-label caption>Developer</q-item-label>
                  </q-item-section>
                </ListItem>
                <ListItem clickable>
                  <q-item-section avatar>
                    <q-avatar color="secondary" text-color="white">B</q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Trần Thị B</q-item-label>
                    <q-item-label caption>Designer</q-item-label>
                  </q-item-section>
                </ListItem>
                <ListItem clickable>
                  <q-item-section avatar>
                    <q-avatar color="positive" text-color="white">C</q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Lê Văn C</q-item-label>
                    <q-item-label caption>Manager</q-item-label>
                  </q-item-section>
                </ListItem>
              </AppList>
            </ComponentCard>
          </div>

          <!-- ListItem variants -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ListItem"
              description="List item with various layouts"
              :props="listItemProps"
            >
              <AppList bordered>
                <ListItem clickable>
                  <q-item-section avatar>
                    <q-icon name="folder" color="primary" />
                  </q-item-section>
                  <q-item-section>With Icon</q-item-section>
                  <q-item-section side>
                    <q-icon name="chevron_right" />
                  </q-item-section>
                </ListItem>
                <ListItem clickable active>
                  <q-item-section avatar>
                    <q-icon name="star" color="warning" />
                  </q-item-section>
                  <q-item-section>Active Item</q-item-section>
                </ListItem>
                <ListItem disable>
                  <q-item-section avatar>
                    <q-icon name="block" />
                  </q-item-section>
                  <q-item-section>Disabled Item</q-item-section>
                </ListItem>
              </AppList>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Media Tab -->
      <q-tab-panel name="media">
        <div class="row q-col-gutter-lg">
          <!-- AppImage -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppImage"
              description="Image with loading state"
              :props="appImageProps"
            >
              <AppImage
                src="https://cdn.quasar.dev/img/mountains.jpg"
                alt="Mountains"
                style="max-width: 300px"
              />
            </ComponentCard>
          </div>

          <!-- AppVideo -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="AppVideo"
              description="Video player component"
              :props="appVideoProps"
            >
              <div class="text-caption text-grey">
                Video component wrapper - sử dụng với source URL
              </div>
            </ComponentCard>
          </div>

          <!-- AppCarousel -->
          <div class="col-12">
            <ComponentCard
              name="AppCarousel"
              description="Image/content carousel"
              :props="appCarouselProps"
            >
              <AppCarousel
                v-model="carouselSlide"
                animated
                arrows
                navigation
                infinite
                autoplay
                height="250px"
                class="rounded-borders"
              >
                <q-carousel-slide
                  v-for="(slide, i) in carouselSlides"
                  :key="i"
                  :name="i"
                  :img-src="slide.src"
                >
                  <div class="absolute-bottom text-center q-pa-md bg-dark-2">
                    {{ slide.title }}
                  </div>
                </q-carousel-slide>
              </AppCarousel>
            </ComponentCard>
          </div>

          <!-- AppParallax -->
          <div class="col-12">
            <ComponentCard
              name="AppParallax"
              description="Parallax scrolling effect"
              :props="appParallaxProps"
            >
              <AppParallax
                src="https://cdn.quasar.dev/img/parallax2.jpg"
                :height="200"
              >
                <div class="text-h4 text-white text-center">
                  Parallax Effect
                </div>
              </AppParallax>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>

      <!-- Pickers & Scroll Tab -->
      <q-tab-panel name="pickers">
        <div class="row q-col-gutter-lg">
          <!-- DatePicker -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="DatePicker"
              description="Date selection picker (wraps QDate)"
              :props="datePickerProps"
            >
              <DatePicker v-model="dateValue" />
              <div class="text-caption q-mt-sm">Giá trị: {{ dateValue ?? '(chưa chọn)' }}</div>
            </ComponentCard>
          </div>

          <!-- TimePicker -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="TimePicker"
              description="Time selection picker (wraps QTime)"
              :props="timePickerProps"
            >
              <TimePicker v-model="timeValue" />
              <div class="text-caption q-mt-sm">Giá trị: {{ timeValue ?? '(chưa chọn)' }}</div>
            </ComponentCard>
          </div>

          <!-- ColorPicker -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ColorPicker"
              description="Color selection picker"
              :props="colorPickerProps"
            >
              <ColorPicker v-model="colorValue" />
              <div
                class="q-mt-sm q-pa-sm rounded-borders"
                :style="{ backgroundColor: colorValue || '#1976D2' }"
              >
                {{ colorValue }}
              </div>
            </ComponentCard>
          </div>

          <!-- FilePicker -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="FilePicker"
              description="File upload picker"
              :props="filePickerProps"
            >
              <FilePicker
                v-model="fileValue"
                label="Chọn tệp"
                accept=".pdf,.doc,.docx"
              />
            </ComponentCard>
          </div>

          <!-- AppEditor -->
          <div class="col-12">
            <ComponentCard
              name="AppEditor"
              description="Rich text editor"
              :props="appEditorProps"
            >
              <AppEditor
                v-model="editorValue"
                min-height="150px"
              />
            </ComponentCard>
          </div>

          <!-- ScrollArea -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="ScrollArea"
              description="Custom scrollbar area"
              :props="scrollAreaProps"
            >
              <ScrollArea style="height: 150px" class="rounded-borders bg-grey-2">
                <div v-for="n in 20" :key="n" class="q-pa-sm">
                  Dòng nội dung {{ n }}
                </div>
              </ScrollArea>
            </ComponentCard>
          </div>

          <!-- VirtualScroll -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="VirtualScroll"
              description="Virtual scroll for large lists"
              :props="virtualScrollProps"
            >
              <VirtualScroll
                :items="virtualItems"
                style="max-height: 150px"
              >
                <template #default="{ item }">
                  <q-item dense>
                    <q-item-section>Item {{ item }}</q-item-section>
                  </q-item>
                </template>
              </VirtualScroll>
            </ComponentCard>
          </div>

          <!-- InfiniteScroll -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="InfiniteScroll"
              description="Infinite loading scroll"
              :props="infiniteScrollProps"
            >
              <div style="height: 150px; overflow: auto" class="rounded-borders bg-grey-2">
                <InfiniteScroll :offset="100" @load="onInfiniteLoad">
                  <div v-for="item in infiniteItems" :key="item" class="q-pa-sm border-bottom">
                    Item {{ item }}
                  </div>
                  <template #loading>
                    <div class="text-center q-pa-sm">
                      <AppSpinner size="sm" />
                    </div>
                  </template>
                </InfiniteScroll>
              </div>
            </ComponentCard>
          </div>

          <!-- Timeline -->
          <div class="col-12 col-md-6">
            <ComponentCard
              name="Timeline / TimelineEntry"
              description="Timeline display"
              :props="timelineProps"
            >
              <Timeline color="primary">
                <TimelineEntry title="Bước 1" subtitle="09:00">
                  Bắt đầu công việc
                </TimelineEntry>
                <TimelineEntry title="Bước 2" subtitle="12:00" color="positive">
                  Hoàn thành phase 1
                </TimelineEntry>
                <TimelineEntry title="Bước 3" subtitle="15:00" color="info">
                  Review và deploy
                </TimelineEntry>
              </Timeline>
            </ComponentCard>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ===== Component Imports =====
// Buttons
import AppButton from '@/components/ui/buttons/AppButton.vue'
import IconButton from '@/components/ui/buttons/IconButton.vue'
import ButtonGroup from '@/components/ui/buttons/ButtonGroup.vue'
import ButtonToggle from '@/components/ui/buttons/ButtonToggle.vue'
import ButtonDropdown from '@/components/ui/buttons/ButtonDropdown.vue'

// Inputs
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppTextarea from '@/components/ui/inputs/AppTextarea.vue'
import AppCheckbox from '@/components/ui/inputs/AppCheckbox.vue'
import AppToggle from '@/components/ui/inputs/AppToggle.vue'
import AppSlider from '@/components/ui/inputs/AppSlider.vue'
import AppRange from '@/components/ui/inputs/AppRange.vue'
import SearchInput from '@/components/ui/inputs/SearchInput.vue'

// Dialogs
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import FormDialog from '@/components/ui/dialogs/FormDialog.vue'
import ConfirmDialog from '@/components/ui/dialogs/ConfirmDialog.vue'
import DeleteDialog from '@/components/ui/dialogs/DeleteDialog.vue'
import AppMenu from '@/components/ui/dialogs/AppMenu.vue'
import AppTooltip from '@/components/ui/dialogs/AppTooltip.vue'
import PopupEdit from '@/components/ui/dialogs/PopupEdit.vue'

// Feedback
import AppSpinner from '@/components/ui/feedback/AppSpinner.vue'
import CircularProgress from '@/components/ui/feedback/CircularProgress.vue'
import AppProgress from '@/components/ui/feedback/AppProgress.vue'
import AppSkeleton from '@/components/ui/feedback/AppSkeleton.vue'
import EmptyState from '@/components/ui/feedback/EmptyState.vue'
import AppBanner from '@/components/ui/feedback/AppBanner.vue'
import InnerLoading from '@/components/ui/feedback/InnerLoading.vue'

// Navigation
import AppTabs from '@/components/ui/navigation/AppTabs.vue'
import TabPanel from '@/components/ui/navigation/TabPanel.vue'
import AppStepper from '@/components/ui/navigation/AppStepper.vue'
import StepperStep from '@/components/ui/navigation/StepperStep.vue'
import AppPagination from '@/components/ui/navigation/AppPagination.vue'
import AppBreadcrumbs from '@/components/ui/navigation/AppBreadcrumbs.vue'
import SidebarItem from '@/components/ui/navigation/SidebarItem.vue'

// Layout
import PageHeader from '@/components/ui/layout/PageHeader.vue'
import SectionHeader from '@/components/ui/layout/SectionHeader.vue'
import AppToolbar from '@/components/ui/layout/AppToolbar.vue'
import AppSeparator from '@/components/ui/layout/AppSeparator.vue'
import AppSpace from '@/components/ui/layout/AppSpace.vue'

// Cards
import AppCard from '@/components/ui/cards/AppCard.vue'
import InfoCard from '@/components/ui/cards/InfoCard.vue'
import StatCard from '@/components/ui/cards/StatCard.vue'
import AppChip from '@/components/ui/cards/AppChip.vue'
import AppBadge from '@/components/ui/cards/AppBadge.vue'

// Lists
import AppList from '@/components/ui/lists/AppList.vue'
import ListItem from '@/components/ui/lists/ListItem.vue'

// Media
import AppImage from '@/components/ui/media/AppImage.vue'
import AppCarousel from '@/components/ui/media/AppCarousel.vue'
import AppParallax from '@/components/ui/media/AppParallax.vue'

// Pickers
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import TimePicker from '@/components/ui/pickers/TimePicker.vue'
import ColorPicker from '@/components/ui/pickers/ColorPicker.vue'
import FilePicker from '@/components/ui/pickers/FilePicker.vue'
import AppEditor from '@/components/ui/pickers/AppEditor.vue'

// Scroll
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue'
import VirtualScroll from '@/components/ui/scroll/VirtualScroll.vue'
import InfiniteScroll from '@/components/ui/scroll/InfiniteScroll.vue'
import Timeline from '@/components/ui/scroll/Timeline.vue'
import TimelineEntry from '@/components/ui/scroll/TimelineEntry.vue'

// ===== ComponentCard for showcase =====
import ComponentCard from '@/components/showcase/ComponentCard.vue'

// ===== Tab Configuration =====
const tabs = [
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
]

const activeTab = ref<string | number>('buttons')

// ===== Demo State =====
// Buttons
const toggleValue = ref<string>('left')

// Inputs
const inputValue = ref<string | number | null>('')
const selectValue = ref<string | null>(null)
const multiSelectValue = ref<string[]>([])
const textareaValue = ref<string | number | null>('')
const checkbox1 = ref<boolean | any[] | null>(true)
const checkbox2 = ref<boolean | any[] | null>(false)
const toggle1 = ref<boolean | any>(true)
const toggle2 = ref<boolean | any>(false)
const sliderValue = ref<number | null>(50)
const rangeValue = ref<{ min: number; max: number } | null>({ min: 20, max: 80 })
const searchValue = ref<string | undefined>('')

// Dialogs
const showAppDialog = ref(false)
const showFormDialog = ref(false)
const showConfirmDialog = ref(false)
const showDeleteDialog = ref(false)
const editableText = ref('Nguyễn Văn A')

// Feedback
const showBanner = ref(true)
const showInnerLoading = ref(false)

// Navigation
const demoTab = ref<string | number>('tab1')
const stepValue = ref(1)
const pageValue = ref(1)

// Layout
const showDrawer = ref(false)

// Media
const carouselSlide = ref<string | number>(0)
const carouselSlides = [
  { src: 'https://cdn.quasar.dev/img/mountains.jpg', title: 'Núi' },
  { src: 'https://cdn.quasar.dev/img/parallax1.jpg', title: 'Bầu trời' },
  { src: 'https://cdn.quasar.dev/img/parallax2.jpg', title: 'Vũ trụ' },
]

// Pickers
const dateValue = ref<string | null>(null)
const timeValue = ref<string | null>(null)
const colorValue = ref<string | null>('#1976D2')
const fileValue = ref<File | File[] | null>(null)
const editorValue = ref<string>('<p>Nội dung <b>rich text</b> editor</p>')

// Scroll
const virtualItems = Array.from({ length: 1000 }, (_, i) => i + 1)
const infiniteItems = ref([1, 2, 3, 4, 5])
const onInfiniteLoad = (_: number, done: (stop?: boolean) => void) => {
  setTimeout(() => {
    const last = infiniteItems.value[infiniteItems.value.length - 1] || 0
    for (let i = 1; i <= 5; i++) {
      infiniteItems.value.push(last + i)
    }
    done(infiniteItems.value.length > 50)
  }, 500)
}

// ===== Props Data =====
interface PropInfo {
  name: string
  type: string
  default: string
  description: string
}

const appButtonProps: PropInfo[] = [
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
]

const iconButtonProps: PropInfo[] = [
  { name: 'icon', type: 'string', default: 'required', description: 'Tên icon Material' },
  { name: 'color', type: 'Color | string', default: 'primary', description: 'Màu icon' },
  { name: 'size', type: 'Size', default: 'md', description: 'Kích thước' },
  { name: 'loading', type: 'boolean', default: 'false', description: 'Hiện loading' },
  { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
]

const buttonGroupProps: PropInfo[] = [
  { name: 'spread', type: 'boolean', default: 'false', description: 'Căn đều các nút' },
  { name: 'outline', type: 'boolean', default: 'false', description: 'Kiểu viền' },
  { name: 'flat', type: 'boolean', default: 'false', description: 'Kiểu phẳng' },
  { name: 'rounded', type: 'boolean', default: 'false', description: 'Bo góc' },
]

const buttonToggleProps: PropInfo[] = [
  { name: 'modelValue', type: 'any', default: '-', description: 'Giá trị v-model' },
  { name: 'options', type: 'Array', default: 'required', description: 'Mảng options {label, value, icon}' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu toggle' },
  { name: 'spread', type: 'boolean', default: 'false', description: 'Căn đều' },
]

const buttonDropdownProps: PropInfo[] = [
  { name: 'label', type: 'string', default: '-', description: 'Nhãn nút' },
  { name: 'icon', type: 'string', default: '-', description: 'Icon nút' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu nút' },
  { name: 'split', type: 'boolean', default: 'false', description: 'Tách nút và dropdown' },
]

const appInputProps: PropInfo[] = [
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
]

const appSelectProps: PropInfo[] = [
  { name: 'modelValue', type: 'any', default: '-', description: 'Giá trị v-model' },
  { name: 'options', type: 'Array', default: 'required', description: 'Danh sách options' },
  { name: 'label', type: 'string', default: '-', description: 'Nhãn select' },
  { name: 'multiple', type: 'boolean', default: 'false', description: 'Cho phép chọn nhiều' },
  { name: 'useChips', type: 'boolean', default: 'false', description: 'Hiện chips khi multiple' },
  { name: 'clearable', type: 'boolean', default: 'false', description: 'Cho phép xóa' },
]

const appTextareaProps: PropInfo[] = [
  { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị v-model' },
  { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
  { name: 'autogrow', type: 'boolean', default: 'false', description: 'Tự động tăng chiều cao' },
  { name: 'rows', type: 'number', default: '3', description: 'Số dòng' },
  { name: 'counter', type: 'boolean', default: 'false', description: 'Hiện đếm ký tự' },
  { name: 'maxlength', type: 'number', default: '-', description: 'Giới hạn ký tự' },
]

const appCheckboxProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Giá trị v-model' },
  { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
  { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
]

const appToggleProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Giá trị v-model' },
  { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
  { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
]

const appSliderProps: PropInfo[] = [
  { name: 'modelValue', type: 'number', default: '0', description: 'Giá trị v-model' },
  { name: 'min', type: 'number', default: '0', description: 'Giá trị min' },
  { name: 'max', type: 'number', default: '100', description: 'Giá trị max' },
  { name: 'step', type: 'number', default: '1', description: 'Bước nhảy' },
  { name: 'label', type: 'boolean', default: 'false', description: 'Hiện label giá trị' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
]

const appRangeProps: PropInfo[] = [
  { name: 'modelValue', type: '{min, max}', default: '-', description: 'Giá trị v-model' },
  { name: 'min', type: 'number', default: '0', description: 'Giá trị min' },
  { name: 'max', type: 'number', default: '100', description: 'Giá trị max' },
  { name: 'label', type: 'boolean', default: 'false', description: 'Hiện labels' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
]

const searchInputProps: PropInfo[] = [
  { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị v-model' },
  { name: 'placeholder', type: 'string', default: 'Tìm kiếm...', description: 'Placeholder' },
  { name: 'debounce', type: 'number', default: '300', description: 'Delay debounce (ms)' },
  { name: 'clearable', type: 'boolean', default: 'true', description: 'Hiện nút xóa' },
]

const appDialogProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
  { name: 'persistent', type: 'boolean', default: 'false', description: 'Không đóng khi click backdrop' },
  { name: 'maximized', type: 'boolean', default: 'false', description: 'Phóng to full màn hình' },
  { name: 'position', type: 'DialogPosition', default: 'standard', description: 'Vị trí: standard, top, bottom...' },
]

const formDialogProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
  { name: 'title', type: 'string', default: '-', description: 'Tiêu đề dialog' },
  { name: 'submitText', type: 'string', default: 'Lưu', description: 'Text nút submit' },
  { name: 'cancelText', type: 'string', default: 'Hủy', description: 'Text nút hủy' },
  { name: 'loading', type: 'boolean', default: 'false', description: 'Trạng thái loading' },
]

const confirmDialogProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
  { name: 'title', type: 'string', default: 'Xác nhận', description: 'Tiêu đề' },
  { name: 'message', type: 'string', default: 'required', description: 'Nội dung xác nhận' },
  { name: 'confirmText', type: 'string', default: 'Đồng ý', description: 'Text nút confirm' },
  { name: 'type', type: 'DialogType', default: 'info', description: 'Loại: info, warning, error, success' },
]

const deleteDialogProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
  { name: 'itemName', type: 'string', default: '-', description: 'Tên item cần xóa' },
  { name: 'requireConfirmation', type: 'boolean', default: 'false', description: 'Yêu cầu nhập tên để xác nhận' },
]

const appMenuProps: PropInfo[] = [
  { name: 'items', type: 'UIMenuItem[]', default: 'required', description: 'Danh sách menu items' },
  { name: 'anchor', type: 'string', default: 'bottom left', description: 'Điểm neo trên target' },
  { name: 'autoClose', type: 'boolean', default: 'true', description: 'Tự động đóng khi click' },
]

const appTooltipProps: PropInfo[] = [
  { name: 'text', type: 'string', default: 'required', description: 'Nội dung tooltip' },
  { name: 'anchor', type: 'string', default: 'top middle', description: 'Điểm neo' },
  { name: 'delay', type: 'number', default: '0', description: 'Delay hiện (ms)' },
  { name: 'maxWidth', type: 'string', default: '-', description: 'Chiều rộng tối đa' },
]

const popupEditProps: PropInfo[] = [
  { name: 'modelValue', type: 'any', default: '-', description: 'Giá trị chỉnh sửa' },
  { name: 'title', type: 'string', default: '-', description: 'Tiêu đề popup' },
  { name: 'buttons', type: 'boolean', default: 'true', description: 'Hiện nút Save/Cancel' },
  { name: 'autoSave', type: 'boolean', default: 'false', description: 'Tự động lưu' },
]

const appSpinnerProps: PropInfo[] = [
  { name: 'size', type: 'Size | string', default: 'md', description: 'Kích thước' },
  { name: 'color', type: 'Color | string', default: 'primary', description: 'Màu' },
  { name: 'thickness', type: 'number', default: '5', description: 'Độ dày' },
]

const circularProgressProps: PropInfo[] = [
  { name: 'value', type: 'number', default: '0', description: 'Giá trị 0-1' },
  { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Chế độ indeterminate' },
  { name: 'size', type: 'string', default: '100px', description: 'Kích thước' },
  { name: 'showValue', type: 'boolean', default: 'false', description: 'Hiện giá trị' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
]

const appProgressProps: PropInfo[] = [
  { name: 'value', type: 'number', default: '0', description: 'Giá trị 0-1' },
  { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Chế độ indeterminate' },
  { name: 'stripe', type: 'boolean', default: 'false', description: 'Hiệu ứng sọc' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu' },
  { name: 'size', type: 'string', default: '-', description: 'Chiều cao' },
]

const appSkeletonProps: PropInfo[] = [
  { name: 'type', type: 'string', default: 'rect', description: 'Loại: text, rect, circle, QBtn...' },
  { name: 'animation', type: 'string', default: 'wave', description: 'Animation: wave, pulse, fade...' },
  { name: 'width', type: 'string', default: '-', description: 'Chiều rộng' },
  { name: 'height', type: 'string', default: '-', description: 'Chiều cao' },
  { name: 'size', type: 'string', default: '-', description: 'Kích thước (cho circle)' },
]

const emptyStateProps: PropInfo[] = [
  { name: 'icon', type: 'string', default: 'inbox', description: 'Icon hiển thị' },
  { name: 'iconSize', type: 'string', default: '64px', description: 'Kích thước icon' },
  { name: 'title', type: 'string', default: '-', description: 'Tiêu đề' },
  { name: 'subtitle', type: 'string', default: '-', description: 'Mô tả phụ' },
]

const appBannerProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'true', description: 'Hiển thị/ẩn' },
  { name: 'inline', type: 'boolean', default: 'false', description: 'Không có padding' },
  { name: 'rounded', type: 'boolean', default: 'false', description: 'Bo góc' },
]

const innerLoadingProps: PropInfo[] = [
  { name: 'showing', type: 'boolean', default: 'false', description: 'Hiển thị loading' },
  { name: 'dark', type: 'boolean', default: 'false', description: 'Overlay tối' },
  { name: 'label', type: 'string', default: '-', description: 'Text hiển thị' },
  { name: 'size', type: 'Size', default: 'md', description: 'Kích thước spinner' },
]

const appTabsProps: PropInfo[] = [
  { name: 'modelValue', type: 'string | number', default: '-', description: 'Tab active' },
  { name: 'vertical', type: 'boolean', default: 'false', description: 'Hướng dọc' },
  { name: 'dense', type: 'boolean', default: 'false', description: 'Compact' },
  { name: 'align', type: 'string', default: 'center', description: 'Căn chỉnh: left, center, right, justify' },
]

const appStepperProps: PropInfo[] = [
  { name: 'modelValue', type: 'number', default: '1', description: 'Step hiện tại' },
  { name: 'vertical', type: 'boolean', default: 'false', description: 'Hướng dọc' },
  { name: 'headerNav', type: 'boolean', default: 'false', description: 'Click header để navigate' },
  { name: 'animated', type: 'boolean', default: 'false', description: 'Animation chuyển step' },
]

const appPaginationProps: PropInfo[] = [
  { name: 'modelValue', type: 'number', default: '1', description: 'Trang hiện tại' },
  { name: 'max', type: 'number', default: 'required', description: 'Tổng số trang' },
  { name: 'directionLinks', type: 'boolean', default: 'false', description: 'Hiện nút prev/next' },
  { name: 'boundaryLinks', type: 'boolean', default: 'false', description: 'Hiện nút first/last' },
]

const appBreadcrumbsProps: PropInfo[] = [
  { name: 'items', type: 'BreadcrumbItem[]', default: '-', description: 'Danh sách items' },
  { name: 'separator', type: 'string', default: '/', description: 'Ký tự phân cách' },
]

const sidebarItemProps: PropInfo[] = [
  { name: 'item', type: 'NavItem', default: 'required', description: 'Navigation item object với label, icon, to, children' },
  { name: 'level', type: 'number', default: '0', description: 'Mức lồng nhau cho nested menu' },
]

const pageHeaderProps: PropInfo[] = [
  { name: 'title', type: 'string', default: '-', description: 'Tiêu đề trang' },
  { name: 'subtitle', type: 'string', default: '-', description: 'Mô tả phụ' },
  { name: 'icon', type: 'string', default: '-', description: 'Icon' },
]

const sectionHeaderProps: PropInfo[] = [
  { name: 'title', type: 'string', default: '-', description: 'Tiêu đề section' },
  { name: 'icon', type: 'string', default: '-', description: 'Icon' },
]

const appToolbarProps: PropInfo[] = [
  { name: 'inset', type: 'boolean', default: 'false', description: 'Inset style' },
]

const appSeparatorProps: PropInfo[] = [
  { name: 'spaced', type: 'boolean', default: 'false', description: 'Có margin' },
  { name: 'vertical', type: 'boolean', default: 'false', description: 'Hướng dọc' },
  { name: 'color', type: 'string', default: '-', description: 'Màu' },
]

const appSpaceProps: PropInfo[] = []

const appDrawerProps: PropInfo[] = [
  { name: 'modelValue', type: 'boolean', default: 'false', description: 'Trạng thái mở/đóng' },
  { name: 'side', type: 'string', default: 'left', description: 'Vị trí: left, right' },
  { name: 'width', type: 'number', default: '300', description: 'Chiều rộng' },
  { name: 'mini', type: 'boolean', default: 'false', description: 'Chế độ mini' },
]

const appCardProps: PropInfo[] = [
  { name: 'flat', type: 'boolean', default: 'false', description: 'Không có shadow' },
  { name: 'bordered', type: 'boolean', default: 'false', description: 'Có viền' },
  { name: 'square', type: 'boolean', default: 'false', description: 'Góc vuông' },
]

const infoCardProps: PropInfo[] = [
  { name: 'title', type: 'string', default: '-', description: 'Tiêu đề' },
  { name: 'subtitle', type: 'string', default: '-', description: 'Mô tả' },
  { name: 'icon', type: 'string', default: '-', description: 'Icon' },
  { name: 'iconColor', type: 'string', default: 'primary', description: 'Màu icon' },
]

const statCardProps: PropInfo[] = [
  { name: 'label', type: 'string', default: 'required', description: 'Nhãn thống kê' },
  { name: 'value', type: 'string | number', default: 'required', description: 'Giá trị' },
  { name: 'icon', type: 'string', default: '-', description: 'Icon' },
  { name: 'trend', type: 'string', default: '-', description: 'Xu hướng (vd: +5%)' },
  { name: 'trendPositive', type: 'boolean', default: 'true', description: 'Trend tích cực' },
]

const appChipProps: PropInfo[] = [
  { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
  { name: 'icon', type: 'string', default: '-', description: 'Icon' },
  { name: 'color', type: 'Color', default: '-', description: 'Màu nền' },
  { name: 'removable', type: 'boolean', default: 'false', description: 'Có thể xóa' },
  { name: 'outline', type: 'boolean', default: 'false', description: 'Kiểu viền' },
  { name: 'clickable', type: 'boolean', default: 'false', description: 'Có thể click' },
]

const appBadgeProps: PropInfo[] = [
  { name: 'label', type: 'string | number', default: '-', description: 'Nội dung badge' },
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu nền' },
  { name: 'floating', type: 'boolean', default: 'false', description: 'Vị trí floating' },
  { name: 'rounded', type: 'boolean', default: 'false', description: 'Bo góc' },
]

const appListProps: PropInfo[] = [
  { name: 'bordered', type: 'boolean', default: 'false', description: 'Có viền' },
  { name: 'separator', type: 'boolean', default: 'false', description: 'Có đường phân cách' },
  { name: 'dense', type: 'boolean', default: 'false', description: 'Compact' },
]

const listItemProps: PropInfo[] = [
  { name: 'clickable', type: 'boolean', default: 'false', description: 'Có thể click' },
  { name: 'active', type: 'boolean', default: 'false', description: 'Trạng thái active' },
  { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
  { name: 'to', type: 'string', default: '-', description: 'Route path' },
]

const appImageProps: PropInfo[] = [
  { name: 'src', type: 'string', default: 'required', description: 'URL hình ảnh' },
  { name: 'alt', type: 'string', default: '-', description: 'Alt text' },
  { name: 'ratio', type: 'number', default: '-', description: 'Tỷ lệ width/height' },
  { name: 'fit', type: 'string', default: 'cover', description: 'Object fit' },
]

const appVideoProps: PropInfo[] = [
  { name: 'src', type: 'string', default: 'required', description: 'URL video' },
  { name: 'ratio', type: 'number', default: '16/9', description: 'Tỷ lệ' },
]

const appCarouselProps: PropInfo[] = [
  { name: 'modelValue', type: 'number', default: '0', description: 'Slide hiện tại' },
  { name: 'animated', type: 'boolean', default: 'false', description: 'Animation' },
  { name: 'autoplay', type: 'boolean | number', default: 'false', description: 'Tự động chuyển' },
  { name: 'arrows', type: 'boolean', default: 'false', description: 'Hiện nút prev/next' },
  { name: 'navigation', type: 'boolean', default: 'false', description: 'Hiện dots' },
  { name: 'infinite', type: 'boolean', default: 'false', description: 'Loop vô hạn' },
]

const appParallaxProps: PropInfo[] = [
  { name: 'src', type: 'string', default: 'required', description: 'URL hình nền' },
  { name: 'height', type: 'number', default: '500', description: 'Chiều cao' },
  { name: 'speed', type: 'number', default: '1', description: 'Tốc độ parallax' },
]

const datePickerProps: PropInfo[] = [
  { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị ngày (DD/MM/YYYY)' },
  { name: 'mask', type: 'string', default: 'DD/MM/YYYY', description: 'Format ngày' },
  { name: 'todayBtn', type: 'boolean', default: 'true', description: 'Hiện nút Hôm nay' },
  { name: 'minimal', type: 'boolean', default: 'false', description: 'Chế độ minimal' },
]

const timePickerProps: PropInfo[] = [
  { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị giờ (HH:mm)' },
  { name: 'mask', type: 'string', default: 'HH:mm', description: 'Format giờ' },
  { name: 'format24h', type: 'boolean', default: 'true', description: 'Định dạng 24 giờ' },
  { name: 'nowBtn', type: 'boolean', default: 'true', description: 'Hiện nút Bây giờ' },
]

const colorPickerProps: PropInfo[] = [
  { name: 'modelValue', type: 'string', default: '-', description: 'Giá trị màu (hex)' },
  { name: 'defaultValue', type: 'string', default: '#000000', description: 'Màu mặc định' },
]

const filePickerProps: PropInfo[] = [
  { name: 'modelValue', type: 'File | File[]', default: '-', description: 'File đã chọn' },
  { name: 'label', type: 'string', default: '-', description: 'Nhãn' },
  { name: 'accept', type: 'string', default: '-', description: 'MIME types cho phép' },
  { name: 'multiple', type: 'boolean', default: 'false', description: 'Cho phép nhiều file' },
]

const appEditorProps: PropInfo[] = [
  { name: 'modelValue', type: 'string', default: '-', description: 'Nội dung HTML' },
  { name: 'minHeight', type: 'string', default: '10rem', description: 'Chiều cao tối thiểu' },
  { name: 'readonly', type: 'boolean', default: 'false', description: 'Chỉ đọc' },
]

const scrollAreaProps: PropInfo[] = [
  { name: 'thumbStyle', type: 'object', default: '-', description: 'Style thanh cuộn' },
  { name: 'barStyle', type: 'object', default: '-', description: 'Style bar' },
  { name: 'delay', type: 'number', default: '1000', description: 'Delay ẩn thanh cuộn' },
]

const virtualScrollProps: PropInfo[] = [
  { name: 'items', type: 'Array', default: 'required', description: 'Danh sách items' },
  { name: 'virtualScrollItemSize', type: 'number', default: '24', description: 'Chiều cao mỗi item' },
  { name: 'virtualScrollSliceSize', type: 'number', default: '30', description: 'Số items render mỗi lần' },
]

const infiniteScrollProps: PropInfo[] = [
  { name: 'offset', type: 'number', default: '500', description: 'Khoảng cách trigger' },
  { name: 'debounce', type: 'number', default: '100', description: 'Debounce delay' },
  { name: 'disable', type: 'boolean', default: 'false', description: 'Vô hiệu hóa' },
]

const timelineProps: PropInfo[] = [
  { name: 'color', type: 'Color', default: 'primary', description: 'Màu đường timeline' },
  { name: 'layout', type: 'string', default: 'dense', description: 'Layout: dense, comfortable, loose' },
  { name: 'side', type: 'string', default: 'right', description: 'Vị trí nội dung' },
]
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #eee;
}

.bg-dark-2 {
  background: rgba(0, 0, 0, 0.5);
}
</style>
