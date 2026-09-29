# Propfund UI → Bloom redesign — detailed plan

**Do not implement the next phase until the previous phase is reviewed.** This file is the task list. Code comes after sign-off on each phase.

Goal: keep Propfund’s product (desk, KYC, checkout, docs, Vanta/HSC). Restyle so **theme and trade chrome** match Bloom / GM Markets (`gm-markets-new`). Do not copy Bloom routes, sheets, datafeeds, or execution.

Look source: `gm-markets-new/app/design-tokens.css`  
Propfund stays **dark-only** unless we later add a Phase 7 light theme.

---

## 0. Current state (as of this plan)

A first pass already touched some files in an earlier session. Treat those as **draft**, not done:

| File | What landed | Still needed |
|---|---|---|
| `app/globals.css` | Forest/mint HSL remap, mint wash | Contrast check on muted text; docs/login |
| `tailwind.config.ts` | Comment only | Glow token unused; optional drop `shadow-glow` |
| `components/ui/button.tsx` | Default button no glow | Destructive/success still fine |
| `DeskTicket.tsx` | Market/Limit, available, % slider | Visual density vs Bloom rail; Limit copy |
| `SizePctSlider.tsx` | New | Keyboard + disabled states |
| `TradingTerminal.tsx` | Passes `availableUsd` | Layout still ticket-left / blotter-right |
| `DeskAccountStrip.tsx` / `DeskBlotter.tsx` | Flatter cards | Tab/Close polish |

**Gate:** walk `/dashboard/trading` and this doc before writing more.

---

## 1. Product rules (non-negotiable)

1. **Same backend.** `submitOrderAction`, `closePositionAction`, `deskPollAction`, Hyperliquid mids stay as they are.
2. **No Bloom imports.** Do not copy `TradeRailTicket.tsx` or `globals.css` wholesale. Recreate the *elements*.
3. **Market-only desk.** Limit tab is visible and disabled. Do not invent limit payloads.
4. **No chart in the first shipping slice.** Bloom’s left pane is TV Advanced Charts. Propfund has no charting-library. Adding it is Phase 6, after ticket/blotter sign-off.
5. **No marketing rewrite until dashboard is signed off.** `app/propfund-marketing.css` is ~9k lines and isolated under `.propfund-site`.
6. **No new git commit/PR** unless asked.

---

## 2. Token map (dark)

| Role | Bloom | Hex | Propfund CSS var |
|---|---|---|---|
| Page | `--bg` | `#0d100d` | `--background` |
| Card | `--surface` | `#121712` | `--card`, `--popover` |
| Raised | `--surface-2` / `3` | `#192119` / `#202a20` | `--secondary`, `--muted` |
| Text | `--text-1` / `--text-2` | `#f3f6ef` / `#c0c9bb` | `--foreground`, `--muted-foreground` |
| Brand | `--accent` / `--accent-strong` | `#8ed99c` / `#baf0c2` | `--primary`, `--ring` |
| Long / up | `--pos` | `#2ed26f` | `--success` |
| Short / down | `--neg` / `--danger` | `#ff625c` / `#c8453c` | `--destructive` |
| Line | `--hairline` | `rgba(243,246,239,0.10)` | `--border` |
| Radius | `--r-3` | `10px` | `--radius` `0.625rem` |

Drop: sapphire `214 90% 56%`, cyan wash, navy-slate, button `shadow-glow` as brand.

Note: shadcn `--accent` is a **hover surface**, not the mint brand. Mint is `--primary`.

---

## 3. File inventory

### Touch (dashboard / shared chrome)

| Path | Why |
|---|---|
| `app/globals.css` | Tokens, wash, scrollbars, selection |
| `tailwind.config.ts` | Comments / unused glow |
| `app/layout.tsx` | Only if we add a theme class |
| `components/ui/button.tsx` | Primary = mint, no sapphire glow |
| `components/ui/card.tsx` | `shadow-sm` → flatter (Bloom `shadow-card: none`) |
| `components/ui/input.tsx` | Focus ring mint |
| `components/ui/select.tsx` | Same |
| `components/ui/tabs.tsx` | Active tab mint, not sapphire |
| `components/app-shell.tsx` | Sidebar active mint tint |
| `components/page-header.tsx` | Density if it fights the ticket |
| `app/dashboard/trading/DeskTicket.tsx` | Bloom rail elements |
| `app/dashboard/trading/SizePctSlider.tsx` | Bloom % control |
| `app/dashboard/trading/TradingTerminal.tsx` | Wire available cash; optional column order |
| `app/dashboard/trading/DeskBlotter.tsx` | Tabs + Close |
| `app/dashboard/trading/DeskAccountStrip.tsx` | Compact stats |
| `app/dashboard/trading/PerpPicker.tsx` | Hairline / mint selected |
| `app/dashboard/trading/TradingApiKeyCard.tsx` | Inherit tokens only |

### Inherit only (no layout rewrite)

`app/dashboard/page.tsx`, `kyc/`, `checkout/`, `copy-trade/`, `payouts/`, `api-keys/`, `webhooks/`, `app/docs/**`, login/signup.

### Defer

`app/propfund-marketing.css`, `components/propfund/**` marketing pages, brand SVGs (unless contrast fails).

### Never

`lib/hsc/**`, `app/actions/trading.ts`, `lib/hyp/**` — behavior stays.

---

## 4. Bloom trade elements → Propfund

Source: `gm-markets-new/components/organisms/trade/widget/TradeRailTicket.tsx`.

| # | Bloom | Propfund today | Plan |
|---|---|---|---|
| 1 | Market / Limit tabs | Market + disabled Limit (draft) | Keep; Limit tooltip only |
| 2 | Split Buy / Sell | Long/Short or Buy/Sell | Keep; pos/neg fills |
| 3 | Available to trade | Cash row (draft) | 100% click; disabled if cash ≤ 0 |
| 4 | Amount + % slider | `SizePctSlider` (draft) | 0/25/50/75/100; USDC vs coin |
| 5 | Limit price | None | Do not add |
| 6 | TP/SL, advanced | None | Do not add |
| 7 | Pair picker | `PerpPicker` | Restyle only |
| 8 | Leverage range | Exists | Mint `accent-primary` |
| 9 | Full-width CTA | Exists | Pos/neg + notional |
| 10 | Chart + book | Missing | Phase 6 |
| 11 | Positions blotter | `DeskBlotter` | Tabs + Close alignment |

Layout: Bloom is **chart | ticket**. Propfund stays **ticket | blotter** until Phase 6.

---

## 5. Phases (do in order)

Each phase: implement → typecheck → browser on listed routes → stop for review.

### Phase A — Tokens & primitives

**Files:** `globals.css`, `button.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `tailwind.config.ts`.

**Steps:**

1. Confirm `:root` HSL matches the token table (already drafted).
2. Selection / focus-visible use `--ring` mint.
3. Remove sapphire/cyan from `body::before`.
4. Card default: no `shadow-sm` (or `shadow-none`).
5. Tabs active: `bg-primary text-primary-foreground`.
6. Grep `214 90`, `shadow-glow`, `cyan` under `app/` and `components/` (not marketing).

**Accept:**

- Overview, Identity, Trading, Docs look forest/mint.
- Primary buttons mint on charcoal, not blue.
- Muted text still readable (`--text-2` / 76% L).

---

### Phase B — Trade ticket (finish draft)

**Files:** `DeskTicket.tsx`, `SizePctSlider.tsx`, `TradingTerminal.tsx`, `PerpPicker.tsx`.

**Steps:**

1. Vertical order: order type → side → available → pair → size + slider → leverage → CTA.
2. `%` of **cash** when unit is USDC; when coin, `%` of `cash * lev / mid` (perp) or `cash / mid` (spot).
3. Slider disabled when cash ≤ 0.
4. Limit tab stays `disabled`.
5. Do not change `submitOrderAction` payload.

**Accept:**

- Drag slider updates size; 100% on available matches cash.
- Submit still fills on the virtual desk.
- Perp vs spot labels (Long/Short vs Buy/Sell) unchanged.
- Mobile: ticket stacks above blotter, no horizontal overflow.

---

### Phase C — Blotter + account strip

**Files:** `DeskBlotter.tsx`, `DeskAccountStrip.tsx`, `TradingApiKeyCard.tsx`.

**Steps:**

1. Positions / Fills: mint active tab, hairline panel.
2. Close: right-aligned, does not shift qty/P&L columns.
3. Strip: Equity, Cash, Used margin, uPnL, Status — mono numbers, `pnlClass` on uPnL.
4. API key card: inherit tokens only.

**Accept:**

- Close still calls `closePositionAction`.
- Empty states readable.
- Header equity still matches blotter marks (`liveDeskBalance` tests stay green).

---

### Phase D — App chrome

**Files:** `components/app-shell.tsx`, `components/page-header.tsx`, `app/dashboard/layout.tsx` (only if needed).

**Steps:**

1. Nav active: `bg-primary/10 text-primary` + mint dot (already close).
2. User menu focus ring mint.
3. No sapphire leftover on sidebar hover.

**Accept:** All eight nav routes (`components/nav.ts`) look consistent.

---

### Phase E — Inherit-only product pages

**Routes:** `/dashboard`, `/dashboard/kyc`, `/checkout`, `/copy-trade`, `/payouts`, `/api-keys`, `/webhooks`, `/docs/*`, `/login`.

**Steps:** Click through; fix local `text-blue-*` / hardcoded sapphire only if contrast breaks. No layout redesign.

**Accept:** No unreadable cards; checkout/KYC still work.

---

### Phase F — Marketing (optional, last)

**Files:** `app/propfund-marketing.css`, `components/propfund/*`.

**Steps:** Swap sapphire/cyan custom properties for forest/mint. Do not rebuild the marketing grid.

**Accept:** Public homepage still loads; CTAs mint/forest.

---

### Phase G — Chart (separate project)

Only after A–C signed off.

- Decide: embed Bloom TV widget vs a light mark chart.
- License / `charting_library` / `public/` assets.
- New layout: chart | ticket, blotter below (Bloom terminal).

Not started in this plan.

---

## 6. Verification matrix

| Check | How |
|---|---|
| Typecheck | `pnpm typecheck` in `propfund-ui` |
| Desk math | `pnpm test -- app/dashboard/trading/desk-types.test.ts` |
| Ticket | Desktop 1280 + mobile 390: slider, pair, side, submit |
| Blotter | Open position → Close → fill appears |
| Chrome | Each `NAV_ITEMS` href |
| Docs | `/docs/trading` readable |
| Login | `/login` still dark, mint primary |

Browser: exercise clicks, not one screenshot.

---

## 7. Suggested review order

1. Read this file (this is the task list).
2. Sign off or edit phases.
3. Then implement **Phase A leftovers** only.
4. Stop. Review Trading + Overview.
5. Then B → C → D → E. F and G only if requested.

---

## 8. Out of scope

- Bloom `basePath`, flo-admin `/admin`, paper-points jobs.
- Changing Vanta agreement / order codes.
- Copying `gm-markets-new` CSS files into Propfund.
- Light theme (`data-theme="light"`) until asked.
