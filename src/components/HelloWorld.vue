<template>
  <div class="container q-pa-lg">
    <div class="flex flex-center column q-mb-xl">
      <q-img
        src="@/assets/logo.png"
        width="150px"
        class="q-mb-md"
      />
      <div class="text-body2 text-grey-6">
        Welcome to
      </div>
      <h1 class="text-h2 text-weight-bold q-my-none">
        Quasar
      </h1>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card
          flat
          bordered
          class="q-pa-lg bg-primary-1"
        >
          <div class="flex items-center q-mb-md">
            <q-icon
              name="rocket_launch"
              size="32px"
              color="primary"
              class="q-mr-md"
            />
            <div>
              <h2 class="text-h5 text-weight-bold q-my-none">
                Get Started
              </h2>
              <p class="text-body2 text-grey-7 q-mb-none">
                Change this page by updating <kbd>&lt;HelloWorld /&gt;</kbd> in <kbd>components/HelloWorld.vue</kbd>.
              </p>
            </div>
          </div>
        </q-card>
      </div>

      <div
        v-for="link in links"
        :key="link.href"
        class="col-12 col-sm-6"
      >
        <q-card
          flat
          bordered
          class="q-pa-lg full-height cursor-pointer hover-card"
          @click="openLink(link.href)"
        >
          <div class="flex items-center">
            <q-avatar
              color="primary"
              text-color="white"
              class="q-mr-md"
            >
              <q-icon :name="link.icon" />
            </q-avatar>
            <div class="flex-grow-1">
              <h3 class="text-h6 text-weight-bold q-my-none">
                {{ link.title }}
              </h3>
              <p class="text-body2 text-grey-7 q-mb-none">
                {{ link.subtitle }}
              </p>
            </div>
            <q-icon
              name="open_in_new"
              color="grey-5"
            />
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const openLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const links = [
  {
    href: 'https://quasar.dev/',
    icon: 'description',
    subtitle: 'Learn about all things Quasar in our documentation.',
    title: 'Documentation',
  },
  {
    href: 'https://quasar.dev/start/vite-plugin',
    icon: 'star_outline',
    subtitle: 'Explore available framework Features.',
    title: 'Features',
  },
  {
    href: 'https://quasar.dev/vue-components',
    icon: 'widgets',
    subtitle: 'Discover components in the API Explorer.',
    title: 'Components',
  },
  {
    href: 'https://discord.gg/5TDhbDg',
    icon: 'groups',
    subtitle: 'Connect with Quasar developers.',
    title: 'Community',
  },
]
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: 0 auto;
}

.bg-primary-1 {
  background-color: rgba(var(--q-primary-rgb), 0.05);
}

.hover-card {
  transition: all 0.2s ease;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

kbd {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.875em;
}
</style>
