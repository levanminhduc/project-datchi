<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="flex items-center q-mb-md">
      <q-icon
        name="dashboard"
        size="32px"
        color="primary"
        class="q-mr-sm"
      />
      <h1 class="text-h4 text-weight-bold q-my-none">
        Danh sách Component Quasar
      </h1>
    </div>

    <!-- Section 1: Navigation & Actions -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-primary text-white q-pa-md text-h6">
        Section 1: Điều hướng & Hành động (Navigation & Actions)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <section class="q-mb-md">
          <h3 class="text-h6 q-mb-md">
            Nút bấm (q-btn) & Nhóm nút toggle (q-btn-toggle)
          </h3>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="flex flex-wrap q-gutter-sm q-mb-md">
                <q-btn
                  color="primary"
                  label="Primary"
                />
                <q-btn
                  color="secondary"
                  label="Secondary"
                  unelevated
                />
                <q-btn
                  outline
                  color="positive"
                  label="Success"
                />
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                >
                  <q-tooltip>Xóa mục này</q-tooltip>
                </q-btn>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <q-btn-toggle
                v-model="btnToggle"
                spread
                no-caps
                toggle-color="primary"
                color="white"
                text-color="black"
                outlined
                :options="[
                  {icon: 'format_align_left', value: 'left'},
                  {icon: 'format_align_center', value: 'center'},
                  {icon: 'format_align_right', value: 'right'}
                ]"
              />
              <div class="text-caption q-mt-sm">
                Giá trị Toggle: {{ btnToggle }}
              </div>
            </div>
          </div>
        </section>

        <q-separator spaced />

        <section>
          <h3 class="text-h6 q-mb-md">
            Nhóm nút & Chip (Group & Chips)
          </h3>
          <div class="flex flex-wrap items-center q-gutter-md">
            <q-btn-group outline>
              <q-btn
                outline
                color="primary"
                icon="add"
              />
              <q-btn
                outline
                color="primary"
                icon="remove"
              />
              <q-btn
                outline
                color="primary"
                icon="refresh"
              />
            </q-btn-group>

            <div class="q-ml-md">
              <q-chip
                color="primary"
                text-white
                icon="label"
                label="Nhãn mới"
                square
              />
              <q-chip
                v-model="chipVisible"
                color="positive"
                text-white
                remova-ble
              >
                Hoàn thành
              </q-chip>
              <q-chip
                outline
                color="warning"
              >
                Đang chờ
              </q-chip>
            </div>
          </div>
        </section>
      </q-card-section>
    </q-card>

    <!-- Section 2: Form Controls -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-secondary text-white q-pa-md text-h6">
        Section 2: Biểu mẫu (Form Controls)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="text"
              label="Họ và tên"
              outlined
              clearable
            >
              <template #prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="city"
              :options="['Hà Nội', 'Đà Nẵng', 'TP. HCM']"
              label="Thành phố"
              outlined
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="skills"
              multiple
              use-chips
              stack-label
              label="Kỹ năng"
              :options="['Vue', 'React', 'Angular']"
              outlined
            />
          </div>

          <div class="col-12 col-md-6">
            <p class="text-subtitle2 q-mb-sm">
              OTP Input (Mã xác thực)
            </p>
            <div class="flex q-gutter-xs">
              <q-input
                v-model="otp"
                mask="######"
                outlined
                style="width: 150px"
                placeholder="000000"
              />
            </div>
          </div>

          <div class="col-12 col-md-6">
            <p class="text-subtitle2 q-mb-sm">
              Chọn màu
            </p>
            <q-color
              v-model="color"
              no-footer
              bordered
            />
          </div>

          <div class="col-12 col-md-6">
            <q-file
              v-model="file"
              label="Tải tệp lên"
              outlined
              counter
            >
              <template #prepend>
                <q-icon name="camera_alt" />
              </template>
            </q-file>
          </div>

          <div class="col-12 col-md-6">
            <div class="flex items-center q-gutter-md">
              <q-checkbox
                v-model="agree"
                label="Đồng ý điều khoản"
                color="primary"
              />
              <q-toggle
                :model-value="isDark"
                label="Chế độ tối (Global)"
                color="indigo"
                @update:model-value="toggle"
              />
              <DarkModeToggle />
              <q-option-group
                v-model="gender"
                :options="[{label: 'Nam', value: 'male'}, {label: 'Nữ', value: 'female'}]"
                color="primary"
                inline
              />
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <p class="text-subtitle2">
              Chọn khoảng giá: {{ range.min }} - {{ range.max }} triệu
            </p>
            <q-range
              v-model="range"
              :min="0"
              :max="100"
              color="primary"
              label
            />
          </div>
          <div class="col-12 col-md-6">
            <p class="text-subtitle2">
              Âm lượng: {{ sliderValue }}
            </p>
            <q-slider
              v-model="sliderValue"
              :min="0"
              :max="100"
              color="positive"
              label
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="date"
              filled
              mask="date"
              :rules="['date']"
              label="Chọn ngày"
            >
              <template #append>
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="date">
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Close"
                          color="primary"
                          flat
                        />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="time"
              filled
              mask="time"
              :rules="['time']"
              label="Chọn giờ"
            >
              <template #append>
                <q-icon
                  name="access_time"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-time v-model="time">
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Close"
                          color="primary"
                          flat
                        />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Section 3: Data Display -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-positive text-white q-pa-md text-h6">
        Section 3: Hiển thị dữ liệu (Data Display)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <h3 class="text-h6 q-mb-md">
          Data Table
        </h3>
        <q-table
          flat
          bordered
          :rows="tableItems"
          :columns="columns"
          row-key="name"
          :pagination="{ rowsPerPage: 5 }"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="props.value === 'Còn hàng' ? 'positive' : props.value === 'Sắp hết' ? 'warning' : 'negative'"
                text-white
                size="sm"
              >
                {{ props.value }}
              </q-chip>
            </q-td>
          </template>
        </q-table>

        <div class="row q-col-gutter-md q-mt-lg">
          <div class="col-12 col-md-6">
            <h3 class="text-h6 q-mb-md">
              Skeleton
            </h3>
            <q-card
              flat
              bordered
            >
              <q-card-section>
                <q-skeleton
                  type="text"
                  class="text-subtitle1"
                />
                <q-skeleton
                  type="text"
                  width="50%"
                  class="text-subtitle2"
                />
                <q-skeleton
                  type="text"
                  class="text-caption"
                />
              </q-card-section>
              <q-card-actions align="right">
                <q-skeleton type="QBtn" />
                <q-skeleton type="QBtn" />
              </q-card-actions>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="text-h6 q-mb-md">
              Markup Table (Simple)
            </h3>
            <q-markup-table
              flat
              bordered
            >
              <thead>
                <tr>
                  <th class="text-left">
                    Dịch vụ
                  </th>
                  <th class="text-right">
                    Giá
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-left">
                    Bảo trì
                  </td>
                  <td class="text-right">
                    500.000đ
                  </td>
                </tr>
                <tr>
                  <td class="text-left">
                    Sửa chữa
                  </td>
                  <td class="text-right">
                    1.200.000đ
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
        </div>

        <h3 class="text-h6 q-mt-lg q-mb-md">
          Virtual Scroll (1000 items)
        </h3>
        <q-virtual-scroll
          v-slot="{ item, index }"
          style="max-height: 200px;"
          :items="virtualItems"
          separator
        >
          <q-item
            :key="index"
            dense
          >
            <q-item-section avatar>
              <q-icon name="storage" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Phần tử thứ {{ item }}</q-item-label>
              <q-item-label caption>
                Dữ liệu mô phỏng cho ID: {{ item }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-virtual-scroll>
      </q-card-section>
    </q-card>

    <!-- Section 4: Feedback -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-info text-white q-pa-md text-h6">
        Section 4: Phản hồi (Feedback)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-banner
          rounded
          class="bg-grey-3 q-mb-md"
        >
          <template #avatar>
            <q-icon
              name="info"
              color="info"
            />
          </template>
          Chào mừng bạn đến với hệ thống quản trị mới!
          <template #action>
            <q-btn
              flat
              color="primary"
              label="Khám phá"
            />
          </template>
        </q-banner>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="q-mb-md">
              <p class="text-subtitle2">
                Đánh giá sao: {{ rating }}/5
              </p>
              <q-rating
                v-model="rating"
                size="2em"
                color="amber"
                icon="star_border"
                icon-selected="star"
                half-increments
              />
            </div>
          </div>
          <div class="col-12 col-md-6">
            <p class="text-subtitle2">
              Tiến trình
            </p>
            <q-linear-progress
              indeterminate
              color="primary"
              class="q-mb-md"
            />
            <div class="flex justify-around items-center">
              <q-circular-progress
                indeterminate
                size="50px"
                color="primary"
              />
              <q-circular-progress
                show-value
                :value="rating * 20"
                size="64px"
                :thickness="0.2"
                color="positive"
                track-color="grey-3"
              >
                {{ rating * 20 }}%
              </q-circular-progress>
            </div>
          </div>
        </div>

        <h3 class="text-h6 q-mt-lg q-mb-md">
          Timeline (Dòng thời gian)
        </h3>
        <q-timeline color="primary">
          <q-timeline-entry
            title="Check-in"
            subtitle="09:00 AM"
            icon="login"
          >
            <div>Bắt đầu ngày làm việc</div>
          </q-timeline-entry>
          <q-timeline-entry
            title="Team Meeting"
            subtitle="14:00 PM"
            icon="groups"
            color="info"
          >
            <div>Thảo luận về UI/UX mới</div>
          </q-timeline-entry>
        </q-timeline>

        <div class="flex q-gutter-md q-mt-lg">
          <q-btn
            color="primary"
            label="Mở Dialog"
            @click="confirmDialog = true"
          />
          <q-btn
            color="positive"
            label="Hiện Notify"
            @click="showNotify"
          />
        </div>

        <q-dialog v-model="confirmDialog">
          <q-card style="min-width: 350px">
            <q-card-section class="row items-center">
              <q-avatar
                icon="warning"
                color="negative"
                text-white
              />
              <span class="q-ml-sm">Hành động này sẽ xóa dữ liệu vĩnh viễn. Bạn chắc chứ?</span>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                v-close-popup
                flat
                label="Hủy"
                color="primary"
              />
              <q-btn
                v-close-popup
                flat
                label="Xác nhận"
                color="negative"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-card-section>
    </q-card>

    <!-- Section 5: Containment -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-deep-purple text-white q-pa-md text-h6">
        Section 5: Containment (Chứa đựng)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-7">
            <h3 class="text-h6 q-mb-md">
              Carousel
            </h3>
            <q-carousel
              v-model="slide"
              swipeable
              animated
              navigation
              infinite
              autoplay
              arrows
              height="300px"
              class="rounded-borders"
            >
              <q-carousel-slide
                v-for="(s, i) in slides"
                :key="i"
                :name="i"
                :img-src="s.src"
              >
                <div class="absolute-bottom custom-caption q-pa-md bg-black-2 text-white text-center">
                  <div class="text-h4">
                    {{ s.title }}
                  </div>
                </div>
              </q-carousel-slide>
            </q-carousel>
          </div>

          <div class="col-12 col-md-5">
            <h3 class="text-h6 q-mb-md">
              Toolbar & Menu
            </h3>
            <q-toolbar class="bg-indigo text-white shadow-2 rounded-borders">
              <q-btn
                flat
                round
                dense
                icon="menu"
              />
              <q-toolbar-title>My App</q-toolbar-title>
              <q-btn
                flat
                round
                dense
                icon="search"
              />
              <q-btn
                flat
                round
                dense
                icon="more_vert"
              >
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item
                      v-for="n in 3"
                      :key="n"
                      v-close-popup
                      clickable
                    >
                      <q-item-section avatar>
                        <q-icon name="star" />
                      </q-item-section>
                      <q-item-section>Menu Item {{ n }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-toolbar>

            <div class="q-mt-lg flex flex-column q-gutter-sm">
              <q-btn
                color="negative"
                label="Hiện Bottom Sheet"
                @click="bottomSheet = true"
              />
              <q-parallax
                :height="150"
                src="https://cdn.quasar.dev/img/parallax2.jpg"
                class="rounded-borders"
              >
                <h1 class="text-white text-h4">
                  Parallax
                </h1>
              </q-parallax>
            </div>

            <q-dialog
              v-model="bottomSheet"
              position="bottom"
            >
              <q-card style="width: 100%">
                <q-card-section class="text-subtitle1">
                  Chia sẻ tài liệu
                </q-card-section>
                <q-list>
                  <q-item
                    v-close-popup
                    clickable
                  >
                    <q-item-section avatar>
                      <q-icon name="email" />
                    </q-item-section>
                    <q-item-section>Gửi qua Email</q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                  >
                    <q-item-section avatar>
                      <q-icon name="link" />
                    </q-item-section>
                    <q-item-section>Copy Link</q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </q-dialog>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Section 6: Selection & Tabs -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-brown text-white q-pa-md text-h6">
        Section 6: Selection & Tabs (Lựa chọn & Tab)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab
            name="one"
            icon="person"
            label="Thông tin"
          />
          <q-tab
            name="two"
            icon="settings"
            label="Cài đặt"
          />
          <q-tab
            name="three"
            icon="lock"
            label="Bảo mật"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="tab"
          animated
          class="q-mt-sm bordered rounded-borders"
        >
          <q-tab-panel name="one">
            <div class="text-h6">
              Cấu hình tài khoản
            </div>
            Sử dụng q-tab-panels để tạo các hiệu ứng chuyển tab mượt mà.
          </q-tab-panel>
          <q-tab-panel name="two">
            Nội dung tab Cài đặt...
          </q-tab-panel>
          <q-tab-panel name="three">
            Nội dung tab Bảo mật...
          </q-tab-panel>
        </q-tab-panels>

        <h3 class="text-h6 q-mt-lg q-mb-md">
          Stepper
        </h3>
        <q-stepper
          ref="stepperRef"
          v-model="step"
          header-nav
          color="primary"
          animated
        >
          <q-step
            :name="1"
            title="Địa chỉ"
            icon="home"
            :done="step > 1"
          >
            Bước 1: Nhập địa chỉ
          </q-step>
          <q-step
            :name="2"
            title="Vận chuyển"
            icon="local_shipping"
            :done="step > 2"
          >
            Bước 2: Chọn đơn vị vận chuyển
          </q-step>
          <q-step
            :name="3"
            title="Thanh toán"
            icon="payment"
          >
            Bước 3: Hoàn tất thanh toán
          </q-step>

          <template #navigation>
            <q-stepper-navigation>
              <q-btn
                color="primary"
                :label="step === 3 ? 'Finish' : 'Continue'"
                @click="nextStep"
              />
              <q-btn
                v-if="step > 1"
                flat
                color="primary"
                label="Back"
                class="q-ml-sm"
                @click="prevStep"
              />
            </q-stepper-navigation>
          </template>
        </q-stepper>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <h3 class="text-h6 q-mb-sm">
              Scroll Area
            </h3>
            <q-scroll-area
              style="height: 100px; border: 1px solid #ddd; border-radius: 4px"
              class="q-pa-sm"
            >
              <div
                v-for="n in 10"
                :key="n"
                class="q-py-xs"
              >
                Nội dung dòng thứ {{ n }} - Quasar Scroll Area demo
              </div>
            </q-scroll-area>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="text-h6 q-mb-sm">
              Chip Group Selection
            </h3>
            <div class="flex q-gutter-xs">
              <q-chip
                v-for="tag in ['React', 'Vue', 'Svelte', 'Angular']"
                :key="tag"
                clickable
                color="primary"
                outline
                :label="tag"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Section 7: Navigation -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-blue text-white q-pa-md text-h6">
        Section 7: Navigation (Điều hướng ứng dụng)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-breadcrumbs class="q-mb-md">
          <q-breadcrumbs-el
            label="Home"
            icon="home"
          />
          <q-breadcrumbs-el label="Components" />
          <q-breadcrumbs-el label="Current Page" />
        </q-breadcrumbs>

        <div class="q-mb-lg flex justify-center">
          <q-pagination
            v-model="page"
            :max="6"
            direction-links
            boundary-links
          />
        </div>

        <div
          class="bordered rounded-borders q-pa-md q-mb-lg bg-grey-1"
          style="height: 150px; position: relative; overflow: hidden"
        >
          <q-header
            bordered
            class="bg-white text-black"
          >
            <q-toolbar>
              <q-btn
                flat
                round
                dense
                icon="menu"
                @click="drawer = !drawer"
              />
              <q-toolbar-title>Demo Navigation</q-toolbar-title>
            </q-toolbar>
          </q-header>
          <q-drawer
            v-model="drawer"
            side="left"
            bordered
            behavior="mobile"
            :width="200"
          >
            <q-list>
              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="home" />
                </q-item-section><q-item-section>Trang chủ</q-item-section>
              </q-item>
              <q-item clickable>
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section><q-item-section>Cấu hình</q-item-section>
              </q-item>
            </q-list>
          </q-drawer>
          <div class="q-pt-xl text-center">
            Nhấn icon menu để mở Side Drawer
          </div>
        </div>

        <div class="flex items-center justify-center">
          <q-fab
            color="primary"
            icon="share"
            direction="up"
          >
            <q-fab-action
              color="blue"
              icon="facebook"
            />
            <q-fab-action
              color="light-blue"
              icon="alternate_email"
            />
          </q-fab>
          <span class="q-ml-md text-caption">Fab (Speed Dial)</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- Section 8: Layout & Others -->
    <q-card
      class="q-mb-lg"
      flat
      bordered
    >
      <q-card-section class="bg-blue-grey text-white q-pa-md text-h6">
        Section 8: Bố cục & Khác (Layout & Others)
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-list
          bordered
          class="rounded-borders q-mb-lg"
        >
          <q-expansion-item
            icon="info"
            label="Chi tiết sản phẩm"
            header-class="text-primary"
          >
            <q-card><q-card-section>Thông tin kỹ thuật chi tiết...</q-card-section></q-card>
          </q-expansion-item>
          <q-expansion-item
            icon="help"
            label="Hỗ trợ kỹ thuật"
          >
            <q-card>
              <q-list dense>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="phone" />
                  </q-item-section><q-item-section>Hotline: 1800 1234</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="email" />
                  </q-item-section><q-item-section>support@example.com</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-expansion-item>
        </q-list>

        <h3 class="text-h6 q-mb-md">
          Editor & Uploader (Quasar Exclusive!)
        </h3>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-7">
            <q-editor
              v-model="editor"
              min-height="150px"
            />
          </div>
          <div class="col-12 col-md-5">
            <q-uploader
              url="http://localhost:4444/upload"
              label="Tải ảnh lên"
              multiple
              accept=".jpg, image/*"
              style="max-width: 300px"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <h3 class="text-h6 q-mb-md">
              Tree (Cấu trúc cây)
            </h3>
            <q-tree
              v-model:ticked="ticked"
              :nodes="treeNodes"
              node-key="label"
              tick-strategy="leaf"
            />
            <div class="text-caption q-mt-sm">
              Đã chọn: {{ ticked }}
            </div>
          </div>
          <div class="col-12 col-md-6">
            <h3 class="text-h6 q-mb-md">
              Intersection (Lazy Loading)
            </h3>
            <q-intersection
              transition="fade"
              class="example-intersection bg-grey-2 flex flex-center rounded-borders"
              style="height: 150px"
            >
              <div class="text-center">
                <q-icon
                  name="visibility"
                  size="lg"
                  color="primary"
                />
                <div class="text-weight-bold">
                  Nội dung Lazy Loading
                </div>
              </div>
            </q-intersection>

            <h3 class="text-h6 q-mt-lg q-mb-md">
              Infinite Scroll
            </h3>
            <div
              class="bordered rounded-borders"
              style="height: 150px; overflow: auto"
            >
              <q-infinite-scroll
                :offset="250"
                @load="onLoadInfinite"
              >
                <div
                  v-for="(item, index) in items"
                  :key="index"
                  class="q-pa-sm border-bottom"
                >
                  Dòng dữ liệu thứ {{ item }}
                </div>
                <template #loading>
                  <div class="row justify-center q-my-md">
                    <q-spinner-dots
                      color="primary"
                      size="40px"
                    />
                  </div>
                </template>
              </q-infinite-scroll>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-footer class="bg-grey-9 text-white q-pa-md text-center rounded-borders q-mt-lg">
      <div>&copy; {{ new Date().getFullYear() }} — <strong>Quasar Framework Complete Showcase</strong></div>
    </q-footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useDarkMode } from '@/composables'

const $q = useQuasar()
const { isDark, toggle } = useDarkMode()

// --- Section 1 ---
const btnToggle = ref('left')
const chipVisible = ref(true)

// --- Section 2 ---
const text = ref('')
const city = ref(null)
const skills = ref(['Vue'])
const otp = ref('')
const color = ref('#6200EE')
const agree = ref(false)
const gender = ref('male')
const range = ref({ min: 30, max: 70 })
const sliderValue = ref(60)
const date = ref('2024/01/25')
const time = ref('12:30')
const file = ref(null)

// --- Section 3 ---
const columns = [
  { name: 'name', label: 'Sản phẩm', align: 'left', field: 'name', sortable: true },
  { name: 'qty', label: 'Số lượng', align: 'right', field: 'qty', sortable: true },
  { name: 'status', label: 'Trạng thái', align: 'center', field: 'status' }
] as any[]
const tableItems = [
  { name: 'Laptop Pro', qty: 5, status: 'Còn hàng' },
  { name: 'Mechanical Keyboard', qty: 12, status: 'Sắp hết' },
  { name: 'Wireless Mouse', qty: 0, status: 'Hết hàng' },
  { name: 'Monitor 4K', qty: 8, status: 'Còn hàng' },
  { name: 'Headset Gaming', qty: 3, status: 'Sắp hết' }
]
const virtualItems = Array.from({ length: 1000 }, (_, i) => i + 1)

// --- Section 4 ---
const rating = ref(4)
const confirmDialog = ref(false)
const showNotify = () => {
  $q.notify({
    message: 'Thao tác thành công!',
    color: 'positive',
    icon: 'check_circle',
    position: 'top'
  })
}

// --- Section 5 ---
const slide = ref(0)
const slides = [
  { src: 'https://cdn.quasar.dev/img/mountains.jpg', title: 'Thiên nhiên' },
  { src: 'https://cdn.quasar.dev/img/parallax1.jpg', title: 'Bầu trời' },
  { src: 'https://cdn.quasar.dev/img/parallax2.jpg', title: 'Vũ trụ' }
]
const bottomSheet = ref(false)

// --- Section 6 ---
const tab = ref('one')
const step = ref(1)
const stepperRef = ref<InstanceType<typeof import('quasar')['QStepper']> | null>(null)
const nextStep = () => {
  if (stepperRef.value) stepperRef.value.next()
}
const prevStep = () => {
  if (stepperRef.value) stepperRef.value.previous()
}

// --- Section 7 ---
const page = ref(1)
const drawer = ref(false)

// --- Section 8 ---
const editor = ref('Đây là nội dung văn bản dài có khả năng <b>chỉnh sửa</b> trực tiếp...')
const ticked = ref([])
const treeNodes = [
  {
    label: 'Dự án (Project)',
    children: [
      {
        label: 'src',
        children: [
          { label: 'assets' },
          { label: 'components' },
          { label: 'pages' }
        ]
      },
      { label: 'public' },
      { label: 'package.json' }
    ]
  }
]
const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

const onLoadInfinite = (index: number, done: (stop?: boolean) => void) => {
  setTimeout(() => {
    const lastItem = items.value[items.value.length - 1] ?? 0
    for (let i = 1; i <= 5; i++) {
      items.value.push(lastItem + i)
    }
    done()
  }, 1000)
}
</script>

<style scoped>
.custom-caption {
  background: rgba(0, 0, 0, 0.4);
}
.border-bottom {
  border-bottom: 1px solid #eee;
}
.bg-black-2 {
  background: rgba(0,0,0,0.4);
}
</style>
