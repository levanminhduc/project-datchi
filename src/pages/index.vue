<template>
  <div>
    <!-- Hero Section -->
    <q-parallax
      src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80"
      :height="600"
    >
      <div class="flex column fit justify-center items-center text-white text-center q-px-md hero-overlay">
        <q-icon
          name="dashboard"
          size="100px"
          color="white"
          class="q-mb-lg animate-bounce"
        />
        <h1 class="text-h2 text-weight-bolder q-mb-md">
          Quasar Framework Showcase
        </h1>
        <p class="text-h5 q-mb-xl max-width-700">
          Khám phá trọn bộ thư viện UI Components mạnh mẽ nhất dành cho Vue 3. 
          Hỗ trợ Responsive, Accessibility và tùy biến linh hoạt.
        </p>
        <div class="flex flex-center q-gutter-md">
          <q-btn
            size="xl"
            color="white"
            text-color="primary"
            unelevated
            to="/components"
            icon="dashboard"
            label="Xem Showcase"
            class="text-weight-bold"
          />
          <q-btn
            size="xl"
            color="white"
            outline
            href="https://quasar.dev"
            target="_blank"
            icon="menu_book"
            label="Tài liệu Quasar"
          />
        </div>
      </div>
    </q-parallax>

    <!-- Features Section -->
    <div class="q-py-xl container mx-auto">
      <div class="text-center q-mb-xl">
        <h2 class="text-h3 text-weight-bold q-mb-md">Tại sao chọn Quasar Framework?</h2>
        <div class="separator mx-auto q-mb-lg"></div>
      </div>

      <div class="row q-col-gutter-lg">
        <div
          v-for="(feature, i) in features"
          :key="i"
          class="col-12 col-md-4"
        >
          <q-card
            flat
            bordered
            class="q-pa-lg full-height transition-swing rounded-borders feature-card"
          >
            <q-avatar
              :color="feature.color"
              text-color="white"
              size="64px"
              class="q-mb-md"
            >
              <q-icon :name="feature.icon" size="32px" />
            </q-avatar>
            <h3 class="text-h5 text-weight-bold q-mb-sm">{{ feature.title }}</h3>
            <p class="text-body1 text-grey-7">
              {{ feature.description }}
            </p>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Quick Stats Section -->
    <q-card square flat class="bg-primary text-white q-py-xl">
      <div class="container mx-auto">
        <div class="row items-center justify-center">
          <div
            v-for="(stat, i) in stats"
            :key="i"
            class="col-6 col-sm-3 text-center"
          >
            <div class="text-h3 text-weight-bolder q-mb-sm">{{ stat.value }}</div>
            <div class="text-subtitle1 opacity-80">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Quick Links -->
    <div class="q-py-xl container mx-auto">
      <q-card flat bordered class="q-pa-xl rounded-borders bg-grey-2">
        <div class="row items-center">
          <div class="col-12 col-md-8">
            <h3 class="text-h4 text-weight-bold q-mb-md">Sẵn sàng trải nghiệm?</h3>
            <p class="text-body1 q-mb-lg">
              Chúng tôi đã tổng hợp hơn 70+ components phổ biến nhất trong trang Showcase. 
              Bạn có thể xem trước cách chúng hoạt động và tương tác trực tiếp.
            </p>
            <div class="flex wrap q-gutter-sm">
              <q-chip
                v-for="link in quickLinks"
                :key="link.text"
                clickable
                @click="link.url ? openUrl(link.url) : (link.to && $router.push(link.to))"
                :color="link.color"
                text-color="white"
                icon="link"
                class="q-pa-md cursor-pointer"
              >
                {{ link.text }}
              </q-chip>
            </div>
          </div>
          <div class="col-12 col-md-4 text-center q-mt-md q-mt-md-none">
            <q-btn
              color="primary"
              size="xl"
              label="Bắt đầu ngay"
              to="/components"
              class="full-width rounded-borders shadow-lg"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Footer -->
    <div class="bg-grey-10 text-white q-py-lg">
      <div class="container mx-auto">
        <div class="row">
          <div class="col-12 text-center">
            <div class="flex justify-center q-mb-lg q-gutter-md">
              <q-btn flat round icon="public" color="white"></q-btn>
              <q-btn flat round icon="code" color="white" href="https://github.com/quasarframework/quasar" target="_blank"></q-btn>
              <q-btn flat round icon="share" color="white"></q-btn>
            </div>
            <p class="text-body2 text-grey-4 q-mb-xs">
              &copy; {{ new Date().getFullYear() }} — Quasar Framework Complete Showcase
            </p>
            <p class="text-caption text-grey-6">
              Built with Vue 3, Quasar, and Vite
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const openUrl = (url: string) => {
  window.open(url, '_blank')
}

const features = [
  {
    title: '70+ Components',
    description: 'Từ các nút bấm cơ bản đến các bảng dữ liệu phức tạp, tất cả đều sẵn sàng để sử dụng.',
    icon: 'widgets',
    color: 'primary'
  },
  {
    title: '10+ Section Chuyên biệt',
    description: 'Phân loại thông minh giúp bạn dễ dàng tìm kiếm và thử nghiệm các nhóm chức năng.',
    icon: 'view_quilt',
    color: 'positive'
  },
  {
    title: 'Demo Tương tác',
    description: 'Trải nghiệm thực tế các hiệu ứng, trạng thái hover, và các phản hồi của component.',
    icon: 'touch_app',
    color: 'warning'
  }
]

const stats = [
  { value: '1000+', label: 'Dòng code demo' },
  { value: '70+', label: 'Components' },
  { value: '10+', label: 'Chủ đề' },
  { value: '100%', label: 'Responsive' }
]

const quickLinks = [
  { text: 'Component Showcase', to: '/components', color: 'primary' },
  { text: 'Quasar Documentation', url: 'https://quasar.dev', color: 'indigo' },
  { text: 'GitHub Repository', url: 'https://github.com/quasarframework/quasar', color: 'grey-8' },
  { text: 'Material Icons', url: 'https://fonts.google.com/icons', color: 'orange-9' }
]
</script>

<style scoped>
.hero-overlay {
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
}

.max-width-700 {
  max-width: 700px;
}

.container {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 16px;
  padding-right: 16px;
}

.separator {
  width: 80px;
  height: 2px;
  background-color: var(--q-primary);
}

.feature-card:hover {
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-4px);
}

.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-20px);}
  60% {transform: translateY(-10px);}
}

.transition-swing {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.cursor-pointer {
  cursor: pointer;
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
}
</style>
