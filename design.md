# Design System Strategy: The Scholarly Editorial

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**

This design system is a rejection of the "SaaS-standard" aesthetic. Inspired by the analytical precision of Benedict Evans and the timelessness of academic journals, it prioritizes narrative clarity over decorative UI. We are building a "Digital Curator"—a system that feels authoritative, intellectual, and expensive.

The experience is defined by high-contrast typography scales, generous whitespace, and an "Editorial Grid" that favors intentional asymmetry. Unlike standard apps that use heavy lines to separate ideas, we use structural breathing room and tonal shifts to guide the eye, creating a layout that feels like a premium digital monograph rather than a software interface.

---

## 2. Colors
The palette is a sophisticated range of architectural greys, punctuated by a singular, earthy Terracotta.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or containment. Boundaries must be defined through background color shifts.
* **Implementation:** Place a `surface_container_low` section directly against a `background` (`#f9f9f9`) to create a clear but soft structural break.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of fine paper.
* **Lowest Tier:** Use `surface_container_lowest` (#ffffff) for primary content cards or "focal point" elements.
* **Base:** Use `surface` (#f9f9f9) as the canvas for the entire application.
* **Nesting:** Place a `surface_container_high` (#e4e9ea) element inside a `surface_container_low` (#f2f4f4) wrapper to indicate secondary meta-information without introducing visual noise.

### The "Glass & Gradient" Rule
To elevate the system, use Glassmorphism for floating headers or navigational sidebars.
* **Tokens:** Apply `surface` at 80% opacity with a `backdrop-blur` of 12px.
* **Signature Textures:** For high-impact CTAs, use a subtle linear gradient from `primary` (#a23f00) to `primary_dim` (#8f3600) at a 45-degree angle. This provides a "tactile ink" feel that flat hex codes cannot replicate.

---

## 3. Typography
The system utilizes a dual-font strategy: **Newsreader** (Serif) for intellectual weight and **Work Sans** (Sans-Serif) for modern precision.

* **Display & Headline (Newsreader):** These levels provide the "scholarly" feel. Use `display-lg` for hero moments to command attention. The high-contrast serif evokes the feel of a printed thesis or a New York Times editorial.
* **Title & Body (Work Sans):** These levels are built for utility and data-heavy environments. The generous x-height of Work Sans ensures that even complex data labels (`label-sm`) remain legible at small scales.
* **Visual Hierarchy:** Always pair a `headline-md` (Serif) with a `body-md` (Sans) to create an immediate distinction between "Narrative" and "Information."

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and ambient light simulation, never through heavy drop shadows.

* **The Layering Principle:** Avoid elevation shadows where possible. Instead, "stack" surface tiers. A `surface_container_lowest` card on a `surface_container_low` background creates a natural, subtle lift.
* **Ambient Shadows:** For critical floating elements (e.g., Modals), use an extra-diffused shadow.
  * *Spec:* `0px 24px 48px rgba(45, 52, 53, 0.06)` (using a tinted version of `on_surface`).
* **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline_variant` at 15% opacity. High-contrast, 100% opaque borders are strictly forbidden.
* **Interaction States:** When hovering over a card, do not increase the shadow depth. Instead, shift the background color from `surface_container_lowest` to `surface_container_low` for a tactile, "pressed-in" feel.

---

## 5. Components

### Buttons
* **Primary:** Solid `primary` (#a23f00) with `on_primary` text. Border-radius: `md` (0.375rem).
* **Secondary (Outlined):** `outline` (#757c7d) at 40% opacity with `primary` text. This ensures the terracotta remains the primary "call to action" without overwhelming the page.
* **Tertiary:** Ghost style. No background, `on_surface` text. Use for low-priority navigation.

### Cards & Lists
* **No Dividers:** Forbid the use of horizontal rules. Separate list items using the spacing scale (e.g., 24px vertical gap) or alternating backgrounds (`surface` to `surface_container_low`).
* **Editorial Cards:** Use `surface_container_lowest` with a "Ghost Border" and no shadow. The header of the card should use `title-md` in the terracotta `primary` color to anchor the content.

### Input Fields
* **Styling:** Inputs should be minimalist. Use a `surface_container_low` background with a bottom-only border of `outline_variant` (2px).
* **Focus State:** Transition the bottom border to `primary` (#a23f00) and subtly shift the background to `surface_container_lowest`.

### Data Visualization (Signature Component)
* **The "Evans" Bar Chart:** Use a monochromatic grey scale (`secondary` through `secondary_fixed_dim`) for comparative data, and reserve the `primary` terracotta for the "Highlight" or "Current" data point. This creates instant analytical focus.

---

## 6. Do's and Don'ts

### Do
* **Do** embrace asymmetry. Allow images or pull-quotes to break the vertical grid to create an editorial feel.
* **Do** use extreme whitespace. If you think there is enough margin, double it.
* **Do** use `primary` sparingly. It is a "laser pointer," not a "paint bucket."

### Don't
* **Don't** use 1px solid black or dark grey borders. They break the "fine paper" illusion.
* **Don't** use standard blue for links. Links should be `on_surface` with a `primary` underline or a subtle color shift on hover.
* **Don't** use rounded corners larger than `xl` (0.75rem). This is an academic system; overly "bubbly" corners detract from the professional tone.

---

## Design Tokens (Quick Reference)

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#a23f00` | CTAs, highlights, terracotta accent |
| `primary_dim` | `#8f3600` | Gradient end, hover states |
| `on_primary` | `#ffffff` | Text on primary backgrounds |
| `surface` | `#f9f9f9` | App canvas / base background |
| `surface_container_lowest` | `#ffffff` | Cards, focal elements |
| `surface_container_low` | `#f2f4f4` | Secondary containers |
| `surface_container_high` | `#e4e9ea` | Meta information, nested elements |
| `on_surface` | `#2d3435` | Primary text |
| `on_surface_variant` | `#6b7374` | Secondary text |
| `on_surface_muted` | `#9ba2a3` | Muted/tertiary text |
| `outline` | `#757c7d` | Ghost borders (at 40% opacity) |
| `outline_variant` | `#c4cbcc` | Very subtle borders (at 15% opacity) |
| `success` | `#2a7d4c` | Positive signals |
| `danger` | `#a23f00` | Same as primary — errors use context, not a different red |
| `warning` | `#c47a20` | Caution signals |

### Typography
| Level | Font | Weight | Size | Line Height |
|-------|------|--------|------|-------------|
| `display-lg` | Newsreader | 400 | 3rem (48px) | 1.15 |
| `display-md` | Newsreader | 400 | 2.25rem (36px) | 1.2 |
| `headline-lg` | Newsreader | 500 | 1.75rem (28px) | 1.25 |
| `headline-md` | Newsreader | 500 | 1.375rem (22px) | 1.3 |
| `title-lg` | Work Sans | 600 | 1.125rem (18px) | 1.4 |
| `title-md` | Work Sans | 600 | 1rem (16px) | 1.4 |
| `body-lg` | Work Sans | 400 | 1rem (16px) | 1.6 |
| `body-md` | Work Sans | 400 | 0.875rem (14px) | 1.6 |
| `body-sm` | Work Sans | 400 | 0.8125rem (13px) | 1.5 |
| `label-lg` | Work Sans | 500 | 0.875rem (14px) | 1.4 |
| `label-md` | Work Sans | 500 | 0.75rem (12px) | 1.4 |
| `label-sm` | Work Sans | 500 | 0.6875rem (11px) | 1.3 |
| `mono` | DM Mono | 400 | 0.8125rem (13px) | 1.5 |

### Spacing
| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |
| `3xl` | 64px |
| `4xl` | 96px |

### Border Radius
| Token | Value |
|-------|-------|
| `sm` | 0.25rem (4px) |
| `md` | 0.375rem (6px) |
| `lg` | 0.5rem (8px) |
| `xl` | 0.75rem (12px) |
