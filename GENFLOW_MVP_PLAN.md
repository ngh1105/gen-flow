# 🚀 GENFLOW MVP PLAN — Visual Builder cho GenLayer

> **Version:** 1.0 · **Date:** 2026-03-20 · **Target:** MVP for Grant Pitching  
> **Timeline:** 2 Tuần · **Budget Server:** $0 (100% Client-side)

---

## 1. 📌 Tổng quan Dự án & Tech Stack

### 1.1 Mục tiêu sản phẩm

**GenFlow** là nền tảng **No-Code Visual Builder** cho phép người dùng Web2 (non-coder) kéo thả các khối logic trên giao diện web để tạo ra **Intelligent Contracts** trên mạng **GenLayer** — mà không cần viết một dòng code nào.

**Hero Use-Case (MVP):** Hợp đồng AI Trọng tài — đọc dữ liệu Web (`gl.nondet.web.render`) và dùng AI phân tích (`gl.nondet.exec_prompt` + `gl.eq_principle`).

### 1.2 Nguyên lý cốt lõi: "Đúc khuôn tĩnh bằng JS" (Static Template Injection)

> [!IMPORTANT]
> Hệ thống **TUYỆT ĐỐI KHÔNG** xây dựng AST Compiler hay Parser phân tích mã nguồn.  
> Thay vào đó, áp dụng chiến lược **"Safe-by-Design Templates"**.

**Cách hoạt động:**

```
┌──────────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│   User Inputs    │──────▶│   JS .replace()     │──────▶│  Python Code     │
│ (name, url,      │       │   Engine            │       │  (Valid GenLayer  │
│  prompt, slider) │       │                     │       │   Contract)      │
└──────────────────┘       └─────────────────────┘       └──────────────────┘
```

1. **Python Template String** chứa code GenLayer chuẩn, đã hard-code sẵn cấu trúc contract hợp lệ.
2. Các **placeholder** như `{{CONTRACT_NAME}}`, `{{URL}}`, `{{PROMPT}}` được đặt tại vị trí dữ liệu do user nhập.
3. Khi user thay đổi input → JavaScript dùng `.replace()` để điền giá trị vào template → render real-time trên Monaco Editor.

**Ưu điểm:**
- ✅ **Zero compilation errors** — Code luôn hợp lệ vì khung đã đúng cú pháp.
- ✅ **Zero backend** — Toàn bộ logic chạy trong trình duyệt.
- ✅ **Instant feedback** — Code cập nhật ngay khi user gõ phím.

### 1.3 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 14+** (App Router, TypeScript) | SPA, Static Export (`output: 'export'`) |
| Drag & Drop | **React Flow** (`@xyflow/react`) | Canvas kéo thả nodes/edges |
| Code Display | **Monaco Editor** (`@monaco-editor/react`) | Hiển thị Python read-only |
| State | **Zustand** | Quản lý nodes, edges, user inputs |
| UI Components | **shadcn/ui** + **Radix UI** | Input, Slider, Button, Card |
| Styling | **Tailwind CSS** | Utility-first CSS |
| Icons | **Lucide React** | Icon system |

### 1.4 Kiến trúc "3 KHÔNG"

| ❌ KHÔNG | Giải thích |
|----------|-----------|
| Backend/Database | App chạy 100% client-side, deploy tĩnh (Vercel/GitHub Pages) |
| Web3/Wallet | Không connect MetaMask, output chỉ là file `.py` + nút Copy |
| GenVM/Linter | Dùng Template Injection, không parse/validate Python syntax |

---

## 2. 📂 Kiến trúc Thư mục (Folder Structure)

```
genflow/
├── public/
│   ├── favicon.ico
│   └── og-image.png                   # Open Graph image cho SEO
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (fonts, metadata)
│   │   ├── page.tsx                    # Main page — Split-screen layout
│   │   └── globals.css                 # Tailwind base + custom tokens
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx              # Logo + tagline bar
│   │   │   ├── CanvasPanel.tsx         # Left 70% — React Flow wrapper
│   │   │   └── CodePanel.tsx           # Right 30% — Monaco + Copy button
│   │   │
│   │   ├── nodes/
│   │   │   ├── InitNode.tsx            # Node 1: Contract Name input
│   │   │   ├── WebFetchNode.tsx        # Node 2: URL input
│   │   │   ├── LLMPromptNode.tsx       # Node 3: Prompt textarea + Slider
│   │   │   └── nodeStyles.ts           # Shared styles/classes for nodes
│   │   │
│   │   └── ui/                         # shadcn/ui generated components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── slider.tsx
│   │       ├── textarea.tsx
│   │       ├── card.tsx
│   │       └── badge.tsx
│   │
│   ├── engine/
│   │   ├── pythonTemplate.ts           # Hard-coded Python template string
│   │   ├── codeGenerator.ts            # .replace() logic: template + data → code
│   │   └── escapeUtils.ts              # String escaping cho Python-safe output
│   │
│   ├── store/
│   │   └── useFlowStore.ts             # Zustand store: nodes, edges, inputs, validation
│   │
│   ├── config/
│   │   ├── initialNodes.ts             # Default node positions & data
│   │   └── initialEdges.ts             # Default edge connections
│   │
│   └── lib/
│       └── utils.ts                    # shadcn cn() utility
│
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── GENFLOW_MVP_PLAN.md                 # ← File này
└── README.md
```

---

## 3. 🐍 Python Template chuẩn GenLayer (Tham chiếu)

Đây là mã nguồn GenLayer hợp lệ mà hệ thống Template Injection sẽ sinh ra. Các placeholder `{{...}}` sẽ được `.replace()` bằng data user nhập:

```python
# { "Depends": "py-genlayer:test" }
from genlayer import *
import json

class {{CONTRACT_NAME}}(gl.Contract):
    result: str

    def __init__(self):
        self.result = ""

    @gl.public.write
    def analyze(self) -> str:
        def task() -> str:
            # Step 1: Fetch web data
            web_data = gl.nondet.web.render("{{URL}}", mode="text")

            # Step 2: AI Analysis with Equivalence Principle
            analysis = gl.nondet.exec_prompt(
                f"""{{PROMPT}}

Dữ liệu web thu thập được:
{web_data}

Hãy phân tích và trả về kết quả."""
            )
            return analysis.strip()

        # Step 3: Consensus validation
        self.result = gl.eq_principle.prompt_non_comparative(
            task,
            task="Analyze web data with AI",
            criteria="Results should convey equivalent meaning and conclusions"
        )
        return self.result

    @gl.public.view
    def get_result(self) -> str:
        return self.result
```

> [!NOTE]
> Slider "Số Validator" (1, 3, 5) là metadata UI — không ảnh hưởng code contract.
> Trong MVP, giá trị này hiển thị dưới dạng comment `# Validators: {{NUM_VALIDATORS}}` trong code output.

---

## 4. 🗺️ Lộ trình Thực thi (4 Phases)

---

### 🔷 Phase 1: Project Setup & Layout Skeleton

**Mục tiêu:** Khởi tạo project Next.js, cài toàn bộ dependencies, xây layout split-screen cơ bản.

**Kiến trúc Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│  🟢 GenFlow — Visual Builder for GenLayer          [GitHub ↗]   │  ← Header
├────────────────────────────────┬─────────────────────────────────┤
│                                │                                 │
│       React Flow Canvas        │       Monaco Editor             │
│       (70% width)              │       (30% width)               │
│                                │                                 │
│   ┌─────────┐                  │   ┌───────────────────────┐     │
│   │ Init    │──────┐           │   │ # Generated Code      │     │
│   │ Node    │      │           │   │ from genlayer import * │     │
│   └─────────┘      ▼           │   │ ...                   │     │
│              ┌──────────┐      │   │                       │     │
│              │ WebFetch │──┐   │   └───────────────────────┘     │
│              │ Node     │  │   │                                 │
│              └──────────┘  │   │   ┌───────────┐                │
│                            ▼   │   │ 📋 Copy   │                │
│              ┌───────────┐     │   └───────────┘                │
│              │ LLMPrompt │     │                                 │
│              │ Node      │     │                                 │
│              └───────────┘     │                                 │
│                                │                                 │
└────────────────────────────────┴─────────────────────────────────┘
```

#### Checklist Phase 1

- [ ] Khởi tạo Next.js project với TypeScript + App Router
- [ ] Cài đặt core dependencies: `@xyflow/react`, `@monaco-editor/react`, `zustand`
- [ ] Cài đặt UI dependencies: `tailwindcss`, `shadcn/ui` (init), `lucide-react`
- [ ] Cấu hình `next.config.ts` với `output: 'export'` (static site)
- [ ] Setup design tokens trong `globals.css` (dark theme colors, fonts)
- [ ] Generate shadcn/ui components: `button`, `input`, `textarea`, `slider`, `card`, `badge`
- [ ] Xây `Header.tsx` — Logo GenFlow + tagline + badge "MVP"
- [ ] Xây `CanvasPanel.tsx` — wrapper cho React Flow (placeholder)
- [ ] Xây `CodePanel.tsx` — Monaco Editor read-only + nút Copy Code
- [ ] Xây layout `page.tsx` — Split-screen: trái 70% Canvas, phải 30% Code
- [ ] Responsive check: đảm bảo layout co giãn khi resize browser

**Kết quả Phase 1:** Giao diện 2 cột hiển thị, Monaco Editor render được text tĩnh.

---

### 🔷 Phase 2: Custom Nodes & React Flow Logic

**Mục tiêu:** Xây dựng 3 Custom Nodes với UI hoàn chỉnh, kết nối Zustand, xử lý kéo thả và nối dây.

#### Custom Nodes Specification

| Node | Inputs | Handle (Ports) | Visual |
|------|--------|-----------------|--------|
| **InitNode** | `Input: Contract Name` | 1 Source (bottom) | 🟢 Green header, icon: `FileCode` |
| **WebFetchNode** | `Input: URL` | 1 Target (top), 1 Source (bottom) | 🔵 Blue header, icon: `Globe` |
| **LLMPromptNode** | `Textarea: AI Prompt`, `Slider: Validators (1,3,5)` | 1 Target (top) | 🟣 Purple header, icon: `Brain` |

#### Checklist Phase 2

- [ ] Tạo Zustand store (`useFlowStore.ts`): nodes, edges, nodeData (inputs), actions
- [ ] Xây `InitNode.tsx` — Card với Input field, kết nối store `onChange`
- [ ] Xây `WebFetchNode.tsx` — Card với Input field (URL), validate URL pattern
- [ ] Xây `LLMPromptNode.tsx` — Card với Textarea + Slider (1/3/5), kết nối store
- [ ] Định nghĩa `nodeStyles.ts` — Shared CSS classes cho node cards (glassmorphism, gradient headers)
- [ ] Setup `initialNodes.ts` — Vị trí default 3 nodes trên canvas (xếp dọc)
- [ ] Setup `initialEdges.ts` — 2 edges mặc định: Init→WebFetch→LLMPrompt
- [ ] Register custom nodeTypes trong React Flow Provider
- [ ] Xử lý `onNodesChange`, `onEdgesChange`, `onConnect` events
- [ ] Test: Kéo thả node, nối dây, gõ text → state Zustand cập nhật

**Kết quả Phase 2:** 3 nodes hiển thị đẹp trên canvas, kéo thả được, nối dây được, input cập nhật Zustand real-time.

---

### 🔷 Phase 3: The Code Engine — Template Injection

**Mục tiêu:** Viết hàm JS quét state Zustand → lấy user data → điền vào Python template → render lên Monaco real-time.

#### Data Flow

```
Zustand Store ──▶ codeGenerator.ts ──▶ CodePanel.tsx
(nodeData)        .replace() x4         (Monaco value)
                  + escapeUtils
```

#### Checklist Phase 3

- [ ] Viết `pythonTemplate.ts` — Python template string chuẩn GenLayer (hard-coded)
  ```
  Placeholders: {{CONTRACT_NAME}}, {{URL}}, {{PROMPT}}, {{NUM_VALIDATORS}}
  ```
- [ ] Viết `escapeUtils.ts`:
  - [ ] `escapePythonString(str)` — Escape `"`, `\`, `\n` để tránh break cú pháp Python
  - [ ] `sanitizeClassName(str)` — Chỉ giữ `[A-Za-z0-9]`, default `"MyContract"` nếu rỗng
  - [ ] `sanitizeURL(str)` — Validate URL format, default placeholder nếu invalid
- [ ] Viết `codeGenerator.ts`:
  - [ ] Export hàm `generateCode(nodeData) → string`
  - [ ] Quét nodeData từ Zustand, escape values, replace placeholders
  - [ ] Trả về Python code string hoàn chỉnh
- [ ] Kết nối `CodePanel.tsx`:
  - [ ] Subscribe Zustand → gọi `generateCode()` → set Monaco `value`
  - [ ] Code update real-time khi user gõ (debounce 150ms)
- [ ] Implement nút **"📋 Copy Code"**:
  - [ ] Sử dụng `navigator.clipboard.writeText()`
  - [ ] Hiệu ứng: icon đổi thành ✅ trong 2 giây sau khi copy

**Kết quả Phase 3:** Gõ text trong Node → Monaco cập nhật Python code real-time → Copy code thành công.

---

### 🔷 Phase 4: Validation, Polish & UX

**Mục tiêu:** Hoàn thiện UX chuyên nghiệp — validation, animation, error states, responsive.

#### Validation Rules

| Node | Rule | Error State |
|------|------|-------------|
| InitNode | `contractName.trim() !== ""` | Viền đỏ nhấp nháy (pulse) |
| WebFetchNode | `url.trim() !== ""` && valid URL | Viền đỏ nhấp nháy |
| LLMPromptNode | `prompt.trim() !== ""` | Viền đỏ nhấp nháy |

#### Checklist Phase 4

- [ ] Thêm validation logic vào Zustand store:
  - [ ] Hàm `getValidationErrors()` → trả về mảng lỗi
  - [ ] Hàm `isAllValid()` → boolean
- [ ] UI Validation trên Nodes:
  - [ ] Node thiếu data → viền đổi sang `border-red-500` + animation `animate-pulse`
  - [ ] Hiển thị badge nhỏ "Required" hoặc icon ⚠️ bên cạnh field trống
- [ ] Nút Copy Code states:
  - [ ] `isAllValid() === false` → Nút bị disable, làm mờ (`opacity-50`), tooltip "Fill all fields"
  - [ ] `isAllValid() === true` → Nút active, gradient border, hover glow
- [ ] Landing polish:
  - [ ] Welcome overlay/tooltip lần đầu mở (hướng dẫn kéo thả cơ bản)
  - [ ] Animated gradient background cho Canvas
  - [ ] Smooth transitions khi node data thay đổi
- [ ] Edge styling:
  - [ ] Animated dashed edges (custom `animated` prop React Flow)
  - [ ] Edge color xanh khi kết nối hợp lệ, xám khi thiếu data
- [ ] Responsive & Polish:
  - [ ] Min-width check: hiện warning nếu screen < 1024px
  - [ ] Loading state cho Monaco Editor (skeleton shimmer)
  - [ ] SEO: title, meta description, Open Graph tags
- [ ] Final QA:
  - [ ] Test full flow: mở app → gõ 3 inputs → code hiện real-time → copy → paste vào editor → Python hợp lệ
  - [ ] Test edge case: special characters `"`, `'`, `\n`, `{{` trong input
  - [ ] Test empty state: mở app mới, nút Copy bị khóa

**Kết quả Phase 4:** MVP hoàn chỉnh, sẵn sàng demo cho Grant Pitching.

---

## 5. ✅ Definition of Done (Tiêu chí hoàn thành MVP)

| # | Tiêu chí | Trạng thái |
|---|---------|------------|
| 1 | App build thành công (`next build`) không error | ⬜ |
| 2 | Deploy tĩnh được (Vercel/GitHub Pages) — chi phí $0 | ⬜ |
| 3 | 3 Custom Nodes kéo thả, nối dây trên canvas | ⬜ |
| 4 | Gõ input → Python code cập nhật real-time trên Monaco | ⬜ |
| 5 | Copy code → paste vào text editor → cú pháp Python hợp lệ | ⬜ |
| 6 | Validation: viền đỏ khi thiếu data, khóa nút Copy | ⬜ |
| 7 | UI đạt chuẩn pitch-ready: dark theme, glassmorphism, animations | ⬜ |
| 8 | Special characters trong input không phá cú pháp Python output | ⬜ |

---

## 6. 📎 Phụ lục: GenLayer API Reference (cho Template)

| API | Mô tả |
|-----|--------|
| `from genlayer import *` | Import toàn bộ GenLayer SDK |
| `gl.Contract` | Base class cho Intelligent Contract |
| `@gl.public.write` | Decorator cho method ghi (thay đổi state) |
| `@gl.public.view` | Decorator cho method đọc (read-only) |
| `gl.nondet.web.render(url, mode="text")` | Fetch nội dung web page |
| `gl.nondet.exec_prompt(prompt)` | Gọi LLM xử lý prompt |
| `gl.eq_principle.prompt_non_comparative(fn, task, criteria)` | Consensus không so sánh |
| `gl.eq_principle.prompt_comparative(fn, task, tolerance)` | Consensus có so sánh (số) |
| `gl.eq_principle.strict_eq(fn)` | Consensus nghiêm ngặt (exact match) |
