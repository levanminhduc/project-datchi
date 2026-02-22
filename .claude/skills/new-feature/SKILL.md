# Skill: /new-feature

Tao tinh nang moi cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-feature [mo ta tinh nang]`, tuan thu TOAN BO huong dan ben duoi.

Skill nay la **orchestrator** - dieu phoi cac layer skills: `/new-db`, `/new-be`, `/new-fe`.

---

## BUOC 0: PHAN TICH YEU CAU

Truoc khi code:
1. Dien giai lai yeu cau bang tieng Viet
2. Xac dinh scope: Database / Backend / Frontend / Tat ca
3. Xac dinh complexity level:
   - **Level 1: Simple CRUD** (master data: colors, suppliers, positions)
   - **Level 2: CRUD + Workflow** (allocations, issues - co status transitions)
   - **Level 3: Batch Operations** (stock, batch - xu ly array items)
4. Hoi user xac nhan truoc khi bat tay vao lam
5. Neu tinh nang co nhieu sub-features → de xuat **Tab layout**

---

## BUOC 1: CHON CHIEN LUOC THUC HIEN

### Decision Tree

| Scope | Chien luoc | Cach lam |
|-------|-----------|----------|
| **DB only** | Single agent | Doc `.claude/skills/new-db/SKILL.md`, thuc hien truc tiep |
| **BE only** | Single agent | Doc `.claude/skills/new-be/SKILL.md`, thuc hien truc tiep |
| **FE only** | Single / Multi agent | Doc `.claude/skills/new-fe/SKILL.md`. Neu phuc tap (>=3 pages) → chia fe-core + fe-page agents |
| **DB + BE** | TeamCreate (2 agents) | Spawn `db-agent` va `be-agent`, be-agent blocked by db-agent |
| **BE + FE** | TeamCreate (2 agents) | Spawn `be-agent` va `fe-agent`, fe-agent blocked by be-agent |
| **DB + FE** | TeamCreate (2 agents) | Spawn `db-agent` va `fe-agent`, fe-agent blocked by db-agent |
| **DB + BE + FE** (full-stack) | TeamCreate (3 agents) | Spawn `db-agent`, `be-agent`, `fe-agent`. Dependencies: db → be → fe |

### Single-layer: Thuc hien truc tiep

Doc skill file tuong ung va lam theo:
```
Doc ".claude/skills/new-db/SKILL.md" va thuc hien cac buoc trong do.
Doc ".claude/skills/new-be/SKILL.md" va thuc hien cac buoc trong do.
Doc ".claude/skills/new-fe/SKILL.md" va thuc hien cac buoc trong do.
```

### Multi-layer: Team Orchestration

```
1. TeamCreate(team_name="feat-<ten>", description="<mo ta>")
2. TaskCreate cho TUNG task cu the (subject, description, activeForm)
3. TaskUpdate de set dependencies (addBlockedBy/addBlocks)
4. Spawn teammates bang Task tool voi team_name parameter
5. Assign tasks cho teammates bang TaskUpdate(owner=<agent-name>)
6. Doi teammates hoan thanh → SendMessage neu can coordinate
7. Khi xong → SendMessage(type="shutdown_request") cho tung teammate
8. TeamDelete() don dep
```

### Agent Prompt Template

Khi spawn agent, PHAI dung prompt nhu sau:

```
Ban la [db-agent/backend-agent/frontend-agent].

**QUAN TRONG - Doc truoc khi lam:**
1. Doc ".claude/skills/new-[db/be/fe]/SKILL.md" va lam theo huong dan trong do.
2. PHAI doc file hien tai truoc khi sua.
3. PHAI kiem tra schema DB (ten cot thuc te) truoc khi viet query.
4. PHAI kiem tra thu tu route truoc khi them route moi.

**Tasks cua ban:**
[List tasks cu the]

**Khi xong:**
Mark task completed bang TaskUpdate, roi kiem tra TaskList cho task tiep.
```

### Dependency Ordering (full-stack)

```
db-agent (Migration, RPC, Index)  → HOAN THANH TRUOC
    ↓
be-agent (Types, Validation, Routes) → blocked by db-agent
    ↓
fe-agent (Types, Service, Composable, Pages) → blocked by be-agent
```

---

## BUOC 2: THU TU THUC HIEN (10 BUOC)

| Buoc | Noi dung | Layer Skill |
|------|----------|-------------|
| 1 | Migration SQL (schema + enum + trigger + index) | `/new-db` |
| 2 | Backend Types (Row, DTO, Filters) | `/new-be` |
| 3 | Validation (Zod schemas, .safeParse) | `/new-be` |
| 4 | Backend Routes (Hono API + dang ky index.ts) | `/new-be` |
| 5 | Frontend Types (enum, interfaces, DTO) | `/new-fe` |
| 6 | Service (fetchApi + buildQueryString) | `/new-fe` |
| 7 | Composable (useLoading.withLoading) | `/new-fe` |
| 8 | List Page (index.vue day du UI) | `/new-fe` |
| 9 | Detail Page ([id].vue) | `/new-fe` |
| 10 | Realtime + Excel Export (neu can) | `/new-fe` |

---

## QUY TAC CROSS-LAYER

### API Flow
```
Frontend → fetchApi() → Hono API → supabaseAdmin → PostgreSQL
```
Frontend KHONG BAO GIO goi Supabase truc tiep cho CRUD. Ngoai le: Realtime subscriptions qua useRealtime.

### Ngon ngu
- Moi thong bao (success, error, validation, toast) bang **tieng Viet**
- Khong co comment thua trong code

### Dinh dang
- Ngay thang: `DD/MM/YYYY` (dung `date.formatDate` tu quasar)
- So luong: `toLocaleString('vi-VN')`

### Response format
```json
{ "data": {...}, "error": null, "message": "optional" }
```
**KHONG dung** `{ success, data, error }`.

### Auth
- Global auth da co qua `except()` trong `server/index.ts`
- Dung `requirePermission()` cho tung endpoint
- `fetchApi()` tu dong gui `Authorization: Bearer <token>`

---

## LUU Y BAO TRI

> Khi thay doi conventions, PHAI cap nhat DONG THOI cac skill files lien quan:
> - `.claude/skills/new-db/SKILL.md`
> - `.claude/skills/new-be/SKILL.md`
> - `.claude/skills/new-fe/SKILL.md`
> - `.claude/skills/new-feature/SKILL.md` (file nay)
>
> Tranh tinh trang skill drift (cac file khong dong bo voi nhau).
