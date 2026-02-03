# Dashboard Feature Specification

**Status:** Synced  
**Level:** 1 (Small)  
**Last Synced:** 2026-01-28  
**Implementation:** `src/pages/index.vue`

---

## Overview

Dashboard overview page displaying key business metrics as stat cards. Currently uses hardcoded placeholder data.

---

## User Stories

### User Story 1 - View Dashboard Overview (Priority: P1)

As a **system user**, I want to see a dashboard overview when I access the application so that I can quickly understand key business metrics at a glance.

**Independent Test:** Navigate to home page (`/`) and verify stat cards are displayed.  
**Inferred from:** `src/pages/index.vue:1-66`

---

## Acceptance Criteria

### Display Requirements

- [x] **AC-1.1:** THE SYSTEM SHALL display a PageHeader with title "Tổng Quan" and subtitle "Bảng điều khiển hệ thống".

- [x] **AC-1.2:** THE SYSTEM SHALL display 4 StatCard widgets showing business metrics.

- [x] **AC-1.3:** THE SYSTEM SHALL display the following stat cards with their respective data:

| Stat | Value | Icon | Color | Trend |
|------|-------|------|-------|-------|
| Tổng nhân viên | 156 | `people` | primary | +12% (positive) |
| Dự án đang thực hiện | 23 | `event_note` | positive | +5% (positive) |
| Yêu cầu bảo trì | 8 | `engineering` | warning | -3% (negative) |
| Sản phẩm tồn kho | 1,234 | `inventory_2` | info | +2% (positive) |

### Responsive Layout

- [x] **AC-1.4:** WHEN the viewport width is less than 600px (mobile), THE SYSTEM SHALL display 1 stat card per row (stacked vertically).

- [x] **AC-1.5:** WHEN the viewport width is between 600px and 1023px (tablet), THE SYSTEM SHALL display 2 stat cards per row.

- [x] **AC-1.6:** WHEN the viewport width is 1024px or greater (desktop), THE SYSTEM SHALL display 4 stat cards per row.

---

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| PageHeader | `src/components/ui/layout/PageHeader.vue` | Page title and subtitle |
| StatCard | `src/components/ui/cards/StatCard.vue` | Metric display widget |

See `specs/ui-component-library/` for component specifications.

---

## Technical Notes

### Current Implementation

- **Data Source:** Static/hardcoded in component (see `src/pages/index.vue:5-38`)
- **Routing:** File-based routing via unplugin-vue-router, accessible at `/`
- **Grid System:** Quasar responsive grid with `col-12 col-md-6 col-lg-3`

### StatCard Props Used

```
label, value, icon, trend, icon-bg-color, trend-positive
```

See `src/components/ui/cards/StatCard.vue:44-50` for prop definitions.

---

## Future Enhancements (Not Implemented)

The following are potential enhancements identified but **NOT currently implemented**:

- [ ] Fetch real-time data from API endpoints
- [ ] Auto-refresh dashboard metrics
- [ ] Clickable stat cards linking to detail pages
- [ ] Date range filter for metrics
- [ ] Additional dashboard widgets (charts, tables)

---

## Implementation Notes

| Attribute | Value |
|-----------|-------|
| Status | Synced |
| Synced From | Existing implementation |
| Sync Date | 2026-01-28 |
| Complexity | Small (static page, no API) |
