<template>
  <q-card
    flat
    bordered
    class="component-card"
  >
    <q-card-section class="bg-grey-2 q-py-sm">
      <div class="text-h6 text-weight-bold">
        {{ name }}
      </div>
      <div class="text-caption text-grey-7">
        {{ description }}
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle2 text-grey-8 q-mb-sm">
        Demo
      </div>
      <slot />
    </q-card-section>

    <q-card-section
      v-if="props.length > 0"
      class="q-pt-none"
    >
      <q-expansion-item
        dense
        header-class="text-subtitle2 text-grey-8"
        label="Props"
        default-opened
      >
        <q-markup-table
          flat
          bordered
          dense
          class="q-mt-sm"
        >
          <thead>
            <tr class="bg-grey-2">
              <th class="text-left">
                Prop
              </th>
              <th class="text-left">
                Type
              </th>
              <th class="text-left">
                Default
              </th>
              <th class="text-left">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prop in props"
              :key="prop.name"
            >
              <td class="text-primary text-weight-medium">
                {{ prop.name }}
              </td>
              <td><code class="text-purple">{{ prop.type }}</code></td>
              <td><code class="text-orange">{{ prop.default }}</code></td>
              <td class="text-grey-8">
                {{ prop.description }}
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-expansion-item>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
interface PropInfo {
  name: string
  type: string
  default: string
  description: string
}

withDefaults(defineProps<{
  name: string
  description: string
  props?: PropInfo[]
}>(), {
  props: () => [],
})
</script>

<style scoped>
.component-card {
  margin-bottom: 1rem;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}
</style>
