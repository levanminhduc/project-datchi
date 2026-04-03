# Guide Image Zoom — Design Spec

**Date:** 2026-04-03
**Feature:** Click-to-zoom with prev/next navigation for images in guide articles
**Library:** `vue-easy-lightbox`
**Scope:** `/guides/:slug` (internal) + `/g/:slug` (public)

---

## Problem

Images in guide articles are rendered via `v-html` as raw `<img>` tags. Users cannot zoom in to see details. No lightbox or zoom capability exists in the current codebase.

---

## Solution

Install `vue-easy-lightbox`, create a reusable composable `use-guide-image-zoom.ts`, and integrate into both guide viewer pages.

---

## Architecture

```
guide content (v-html) renders <img> tags in .guide-prose
        ↓
use-guide-image-zoom composable
  - scans DOM for all <img> in containerRef
  - collects src[] array
  - attaches click event delegation on container
  - on click: finds image index → sets visible = true
        ↓
VueEasyLightbox component (template)
  - receives imgs[], visible, index
  - renders full-screen overlay with prev/next navigation
  - Esc / click backdrop → close
```

---

## Files

| File | Change |
|---|---|
| `package.json` | Add `vue-easy-lightbox` |
| `src/composables/use-guide-image-zoom.ts` | **New** — zoom logic |
| `src/pages/guides/[slug].vue` | Add `ref`, composable, `<VueEasyLightbox>` |
| `src/pages/g/[slug].vue` | Add `ref`, composable, `<VueEasyLightbox>` |
| `src/styles/guide-prose.scss` | Add `cursor: zoom-in` to `.guide-prose img` |

---

## Composable: `use-guide-image-zoom.ts`

**Inputs:** `containerRef: Ref<HTMLElement | null>`

**Returns:** `{ visible, imgs, index, rescan }`

**Behavior:**
- `rescan()`: queries all `img` elements inside `containerRef`, extracts `src` into `imgs[]`, attaches one `click` event listener (delegation) on the container. Replaces previous listener to avoid duplicates.
- Click on `<img>` inside container: compute index in `imgs[]`, set `index`, set `visible = true`
- `onBeforeUnmount`: remove click listener

---

## Page Integration

Both pages share identical integration pattern:

```vue
<script setup>
const proseRef = ref<HTMLElement | null>(null)
const { visible, imgs, index, rescan } = useGuideImageZoom(proseRef)

// Re-scan after guide loads (async) and v-html renders
watch(guide, async (val) => {
  if (val) {
    await nextTick()
    rescan()
  }
})
</script>

<template>
  <div ref="proseRef" class="guide-prose" v-html="guide.content_html" />

  <VueEasyLightbox
    :visible="visible"
    :imgs="imgs"
    :index="index"
    @hide="visible = false"
  />
</template>
```

---

## CSS Change

```scss
// src/styles/guide-prose.scss — inside .guide-prose img {}
cursor: zoom-in;
```

---

## Out of Scope

- Editor page (`editor.vue`) — no zoom needed while authoring
- `AppImage` component — unrelated
- Backend / DB — no changes

---

## Constraints

- `vue-easy-lightbox` requires Vue 3 (satisfied: Vue 3 + Quasar 2)
- Images in `v-html` are raw `<img>` tags; composable bridges them to lightbox via DOM scan
- `rescan()` must run after `nextTick()` post data-load to ensure DOM is ready
