
## 1. Visual Theme & Atmosphere

The ZannID design system embodies a modern, tech-forward aesthetic with a confident and approachable personality. Built around vibrant purple and blue accents layered over a clean, minimal neutral foundation, the system balances professional functionality with contemporary visual energy. The design prioritizes clarity and usability through generous whitespace, rounded soft corners, and carefully calibrated shadows that create subtle depth without visual clutter. This creates an inviting, trustworthy environment for a platform focused on account generation and premium content access—blending technical sophistication with user-friendly warmth.

**Key Characteristics**
- Modern, minimalist with carefully applied depth
- Vibrant purple and blue gradients as primary interaction elements
- Generous whitespace and breathing room between components
- Soft, rounded corner treatments across all interactive elements
- Subtle shadow elevation for visual hierarchy
- Professional yet approachable tone
- High contrast between text and backgrounds for accessibility
- Clean, geometric button treatments with smooth interactions

## 2. Color Palette & Roles

### Primary
- **Brand Dark** (`#111827`): Primary text, headings, and main UI elements throughout the interface
- **Brand Black** (`#212529`): Secondary text and darker UI accents
- **Pure White** (`#FFFFFF`): Primary background surface for cards, containers, and main content areas

### Accent Colors
- **Purple Primary** (`#8B5CF6`): Main brand accent used for CTAs, highlights, and premium features
- **Blue Primary** (`#0D6EFD`): Secondary action color and navigation highlights
- **Cyan Accent** (`#0DCAF0`): Tertiary accent for supporting UI elements

### Interactive
- **Button Primary Shadow** (`#8B5CF6`): Used in box-shadow for primary buttons with `rgba(139, 92, 246, 0.28)` and `rgba(139, 92, 246, 0.3)` variants
- **Success Green** (`#198754`): Confirmation and positive action states

### Neutral Scale
- **Text Secondary** (`#6B7280`): Secondary body text and muted labels
- **Text Tertiary** (`#6C757D`): Tertiary text for captions and helper text
- **Gray Light** (`#ADB5BD`): Lighter neutral tones for subtle UI elements
- **Surface Light** (`#F8F9FA`): Light background for alternative sections
- **Border Light** (`#EEF0F4`): Primary border color for cards and containers
- **Border Medium** (`#DEE2E6`): Secondary border for form inputs and dividers
- **Border Code** (`#C9D1D9`): Border color for code blocks and specialized containers

### Surface & Borders
- **Pure Black** (`#000000`): Maximum contrast text and dark overlays
- **Card Background** (`#FFFFFF`): Primary container surface with shadow elevation
- **Code Background** (`#0F172A`): Dark surface for code blocks and terminal-like components

### Semantic / Status
- **Error Red** (`#DC3545`): Error messages, validation failures, and destructive actions
- **Warning Yellow** (`#FFC107`): Warning messages and caution states

## 3. Typography Rules

### Font Family
**Primary:** Plus Jakarta Sans with fallback stack `system-ui, -apple-system, sans-serif`
**Secondary:** JetBrains Mono for code and monospace content with fallback stack `'Courier New', monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / H1 | Plus Jakarta Sans | 36.8px | 800 | 46px | 0px | Hero section headings, primary page title |
| Heading H2 | Plus Jakarta Sans | 25.6px | 800 | 30.72px | 0px | Section headings and subheadings |
| Body Text | Plus Jakarta Sans | 15.2px | 400 | 22.8px | 0px | Primary body copy and descriptions |
| Body Semibold | Plus Jakarta Sans | 15.2px | 700 | 22.8px | 0px | Emphasis within body text, strong copy |
| Button Text | Plus Jakarta Sans | 13.6px | 700 | 20.4px | 0px | CTA buttons and actionable elements |
| Navigation Link | Plus Jakarta Sans | 16px | 400 | 24px | 0px | Top navigation and primary links |
| Small Link | Plus Jakarta Sans | 14.08px | 500 | 21.12px | 0px | Secondary links and navigation options |
| Code / Monospace | JetBrains Mono | 12px | 400 | 18px | 0px | Code blocks, terminal output, technical text |

### Principles
- Use weight 800 exclusively for display and heading hierarchy to establish clear visual dominance
- Body text employs weight 400 as default with weight 700 reserved for emphasis or semantic importance
- Maintain generous line heights (1.4–1.5 ratio) for improved readability across body and heading tiers
- Monospace font (JetBrains Mono) applies solely to code and terminal-like content to signal technical context
- Size progression follows a logical scale (12px → 13.6px → 14.08px → 15.2px → 16px → 25.6px → 36.8px) to create clear hierarchy without excess granularity

## 4. Component Stylings

### Buttons

#### Primary CTA Button (Large)
- **Background:** `rgba(0, 0, 0, 0)` (transparent with gradient overlay)
- **Text Color:** `#FFFFFF`
- **Font Size:** `15.2px`
- **Font Weight:** `700`
- **Padding:** `13.6px 25.6px`
- **Border Radius:** `14px`
- **Border:** `0px none`
- **Box Shadow:** `rgba(139, 92, 246, 0.3) 0px 8px 22px 0px`
- **Height:** `49.98px`
- **Line Height:** `22.8px`
- **Hover State:** Increase shadow opacity to `rgba(139, 92, 246, 0.4) 0px 10px 26px 0px`, scale transform `1.02`

#### Primary CTA Button (Full Width)
- **Background:** `rgba(0, 0, 0, 0)` (transparent with gradient overlay)
- **Text Color:** `#FFFFFF`
- **Font Size:** `15.2px`
- **Font Weight:** `700`
- **Padding:** `13.6px 13.6px`
- **Border Radius:** `14px`
- **Border:** `0px none`
- **Box Shadow:** `rgba(139, 92, 246, 0.3) 0px 8px 22px 0px`
- **Width:** `100%`
- **Height:** `49.98px`
- **Line Height:** `22.8px`
- **Hover State:** Increase shadow opacity to `rgba(139, 92, 246, 0.4) 0px 10px 26px 0px`

#### Secondary Button (Compact)
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#FFFFFF`
- **Font Size:** `13.6px`
- **Font Weight:** `700`
- **Padding:** `8px 15.2px`
- **Border Radius:** `10px`
- **Border:** `0px none`
- **Box Shadow:** `rgba(139, 92, 246, 0.28) 0px 6px 16px 0px`
- **Height:** `36.39px`
- **Line Height:** `20.4px`
- **Hover State:** Brighten background to `rgba(139, 92, 246, 0.15)`, increase shadow

#### Icon Button (Circular)
- **Background:** `#FFFFFF`
- **Text Color:** `#111827`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `1px 6px`
- **Border Radius:** `50%`
- **Border:** `1px solid #EEF0F4`
- **Box Shadow:** `none`
- **Height:** `38px`
- **Width:** `38px`
- **Line Height:** `24px`
- **Hover State:** Background shift to `#F8F9FA`, border to `#DEE2E6`

#### Code Block Button (Terminal)
- **Background:** `#212529`
- **Text Color:** `#C9D1D9`
- **Font Size:** `12px`
- **Font Weight:** `400`
- **Font Family:** JetBrains Mono
- **Padding:** `4.8px 9.6px`
- **Border Radius:** `8px`
- **Border:** `1px solid #303637`
- **Box Shadow:** `none`
- **Height:** `29.59px`
- **Line Height:** `18px`
- **Hover State:** Border shift to `#48545D`, background lighten slightly

### Cards & Containers

#### Standard Card
- **Background:** `#FFFFFF`
- **Text Color:** `#111827`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `24px`
- **Border Radius:** `22px`
- **Border:** `1px solid #EEF0F4`
- **Box Shadow:** `rgba(17, 24, 39, 0.05) 0px 12px 34px 0px`
- **Line Height:** `24px`
- **Hover State:** Border shift to `#DEE2E6`, shadow increase to `rgba(17, 24, 39, 0.08) 0px 14px 40px 0px`

#### Card (Compact, Minimal Spacing)
- **Background:** `#FFFFFF`
- **Padding:** `16px`
- **Border Radius:** `22px`
- **Border:** `1px solid #EEF0F4`
- **Box Shadow:** `rgba(17, 24, 39, 0.05) 0px 12px 34px 0px`

### Inputs & Forms

#### Text Input
- **Background:** `#FFFFFF`
- **Text Color:** `#111827`
- **Font Size:** `15.2px`
- **Padding:** `12px 16px`
- **Border Radius:** `10px`
- **Border:** `1px solid #DEE2E6`
- **Box Shadow:** `none`
- **Focus State:** Border color shift to `#8B5CF6`, box-shadow `0 0 0 3px rgba(139, 92, 246, 0.1)`
- **Placeholder Color:** `#ADB5BD`

#### Form Label
- **Font Size:** `14.08px`
- **Font Weight:** `500`
- **Color:** `#111827`
- **Margin Bottom:** `8px`

### Navigation

#### Top Navigation Bar
- **Background:** `rgba(0, 0, 0, 0)` (transparent or `#FFFFFF` on scroll)
- **Height:** `64px`
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between
- **Padding:** `0px 12px`
- **Box Shadow:** `none` (or subtle on scroll: `rgba(17, 24, 39, 0.05) 0px 4px 12px 0px`)

#### Navigation Link
- **Text Color:** `#111827`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `0px`
- **Active State:** Color shift to `#8B5CF6`, text-weight to `700`
- **Hover State:** Color shift to `#6B7280`

#### Secondary Navigation Link
- **Text Color:** `#6B7280`
- **Font Size:** `14.08px`
- **Font Weight:** `500`
- **Padding:** `8px 14.4px`
- **Border Radius:** `10px`
- **Hover State:** Background to `#EEF0F4`, text color to `#111827`

### Alerts & Notifications

#### Warning Alert Banner
- **Background:** `#FFC107` (with opacity `0.15` applied)
- **Text Color:** `#212529`
- **Border Left:** `4px solid #FFC107`
- **Padding:** `12px 16px`
- **Border Radius:** `8px`
- **Font Size:** `14.08px`
- **Font Weight:** `500`

#### Error State Alert
- **Background:** `#DC3545` (with opacity `0.15` applied)
- **Text Color:** `#212529`
- **Border Left:** `4px solid #DC3545`
- **Padding:** `12px 16px`
- **Border Radius:** `8px`

#### Success State Alert
- **Background:** `#198754` (with opacity `0.15` applied)
- **Text Color:** `#212529`
- **Border Left:** `4px solid #198754`
- **Padding:** `12px 16px`
- **Border Radius:** `8px`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

**Scale & Usage:**
- `4px`: Micro gaps, icon spacing, tight component grouping
- `8px`: Small gaps between related elements, minor padding
- `12px`: Standard form field padding, label spacing
- `16px`: Medium spacing, button padding, card internal spacing
- `20px`: Section internal spacing, container padding variants
- `24px`: Card padding standard, significant component spacing
- `48px`: Large padding for section content areas
- `60px`: Major section vertical spacing, page breaks

### Grid & Container

- **Max Width:** `1320px` for content containers
- **Column Strategy:** 12-column grid with `16px` gutter spacing
- **Mobile Container Width:** `100%` with `16px` horizontal padding
- **Tablet Container Width:** `768px` with `24px` padding
- **Desktop Container Width:** `1320px` with equal margin distribution

### Whitespace Philosophy

The design system employs a philosophy of "breathing space" where whitespace is a design element in itself. Generous margins around components encourage visual rest and cognitive processing. Cards and containers utilize `24px` padding to create internal breathing room. Section spacing uses `60px` vertical margins to clearly delineate content zones. This approach prevents cognitive overload and guides user attention through natural visual hierarchy.

### Border Radius Scale

- `0px`: Reserved for precise geometric layouts and grid alignments
- `8px`: Code blocks, terminal elements, compact UI controls
- `10px`: Form inputs, compact buttons, secondary navigation items
- `14px`: Primary buttons, CTA elements, standard interactive components
- `22px`: Cards and larger containers, elevated component groupings
- `50%`: Perfect circles for icon buttons, avatars, badge pills

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | `box-shadow: none` | Text-only elements, flat backgrounds, dismissable content |
| Subtle (Level 1) | `rgba(17, 24, 39, 0.05) 0px 12px 34px 0px` | Cards, containers, default card surfaces |
| Elevated (Level 2) | `rgba(139, 92, 246, 0.28) 0px 6px 16px 0px` | Secondary buttons, supported elements |
| High (Level 3) | `rgba(139, 92, 246, 0.3) 0px 8px 22px 0px` | Primary CTA buttons, premium features, focused states |
| Interactive (Hover) | `rgba(139, 92, 246, 0.4) 0px 10px 26px 0px` | Elevated interactive elements during hover, active buttons |

**Shadow Philosophy:** The elevation system uses purple-tinted shadows derived from the primary accent color (`#8B5CF6`), creating visual cohesion between the brand identity and spatial depth. Subtle ambient shadows (Level 1) establish basic separation without visual heaviness. Interactive shadows (Levels 2–3) employ the brand color with varying opacity to reinforce CTAs and premium features. Hover states increase shadow intensity to provide tactile feedback without jarring transitions. This creates a layered, polished interface where depth communicates importance and interactivity.

## 7. Do's and Don'ts

### Do
- **Use purple gradients (`#8B5CF6` to `#0D6EFD`)** for all primary CTAs and premium feature highlights to reinforce brand identity
- **Maintain `24px` padding** in card containers to ensure content breathing room and legibility
- **Apply `22px` border radius** to all cards and large containers for consistency with brand roundness aesthetic
- **Use `15.2px` weight 400** for body text and `15.2px` weight 700 for emphasis to maintain clear typographic hierarchy
- **Stack alerts and notifications** with `12px` internal padding and left border accent in semantic colors
- **Employ the full-width button treatment** (`100%` width with `13.6px` padding) for primary mobile CTAs and account generation flows
- **Group related navigation items** with `8px` spacing and `10px` border radius for compact link clusters
- **Apply subtle shadows** (`rgba(17, 24, 39, 0.05)`) to default cards and increase shadow on hover for interactive feedback
- **Use monospace (JetBrains Mono)** exclusively for code blocks, terminal output, and technical displays
- **Maintain high contrast** between `#111827` text and `#FFFFFF` backgrounds (minimum WCAG AA standard)

### Don't
- **Don't use multiple accent colors** in a single component; prioritize `#8B5CF6` for CTAs and reserve `#0D6EFD` and `#0DCAF0` for supporting roles
- **Don't apply border radius** smaller than `8px` to interactive elements; maintain readability and touch-target size
- **Don't use black (`#000000`)** for primary text; use `#111827` instead for softer, more refined appearance
- **Don't add shadows** to text-only elements or flat backgrounds; reserve shadows for elevated container components
- **Don't mix font families** within a single heading or body section; maintain Plus Jakarta Sans for primary UI
- **Don't stack buttons** closer than `12px` apart; allow visual breathing room between interactive elements
- **Don't use warning yellow** (`#FFC107`) for error states; reserve `#DC3545` for errors exclusively
- **Don't reduce button padding** below `8px` for standard buttons; maintain minimum `36px` height for accessible touch targets
- **Don't apply color opacity** directly to brand colors without using `rgba()` values; preserve color integrity
- **Don't omit border styling** on form inputs; use `1px solid #DEE2E6` to establish clear input zones

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|---|---|---|
| Mobile (xs) | 320px–599px | Full-width containers with `16px` padding, single-column layout, stacked buttons, font-size reduction on display headings (32px) |
| Tablet (sm) | 600px–899px | `50%` column width for grid, `24px` horizontal padding, buttons remain full-width, navigation collapses to hamburger menu |
| Medium (md) | 900px–1119px | Two-column content layout, container max-width `768px`, navigation inline, `32px` horizontal padding |
| Desktop (lg) | 1120px–1419px | Three-column capable, container max-width `1120px`, sidebar navigation, full horizontal navigation bar |
| Large (xl) | 1420px+ | Full-width layout, container max-width `1320px`, multi-column grids, sidebar persistent |

### Touch Targets

- **Minimum Touch Target Size:** `44px × 44px` for all interactive elements (buttons, links, icon controls)
- **Recommended Button Height:** `36px` for compact buttons, `49px` for primary CTAs
- **Icon Button Size:** `38px × 38px` (accommodates `24px` icon with `7px` padding on all sides)
- **Navigation Link Padding:** `8px 14.4px` to maintain minimum `37px` height target
- **Spacing Between Targets:** Minimum `12px` gap between adjacent interactive elements to prevent accidental activation

### Collapsing Strategy

- **Navigation:** At `600px`, primary navigation collapses into hamburger menu icon (`38px × 38px`); secondary navigation disappears into menu structure
- **Cards:** Single column on mobile, center-aligned with full-width treatment; `24px` margin on each side; at tablet breakpoint shift to two-column grid
- **Buttons:** Full-width (`100%` width) below `600px`; inline (auto-width) at tablet and above with min-width `120px`
- **Headings:** Display heading (H1) reduces from `36.8px` to `28px` on tablet, `24px` on mobile; maintains `800` weight
- **Padding:** Containers reduce from `48px` to `24px` (tablet) to `16px` (mobile); cards reduce from `24px` to `16px` on mobile
- **Grid Columns:** Desktop 12-column → Tablet 6-column → Mobile single-column; gutter reduces from `16px` to `12px` on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Purple Primary (`#8B5CF6`)
- **Secondary CTA:** Blue Primary (`#0D6EFD`)
- **Background (default):** Pure White (`#FFFFFF`)
- **Background (light):** Surface Light (`#F8F9FA`)
- **Heading text:** Brand Dark (`#111827`)
- **Body text:** Brand Dark (`#111827`)
- **Text secondary:** Text Secondary (`#6B7280`)
- **Border color:** Border Light (`#EEF0F4`)
- **Error state:** Error Red (`#DC3545`)
- **Warning state:** Warning Yellow (`#FFC107`)
- **Success state:** Success Green (`#198754`)
- **Code background:** Pure Black (`#000000`) or Code Background (`#0F172A`)
- **Code text:** Border Code (`#C9D1D9`)

### Iteration Guide

1. **Button Styling Rule:** All primary CTAs must use purple gradient (`#8B5CF6` base) with `rgba(139, 92, 246, 0.3) 0px 8px 22px 0px` shadow; apply `14px` border radius; maintain `15.2px` font size with `700` weight

2. **Card Structure Rule:** Every card container uses `24px` padding, `22px` border radius, `1px solid #EEF0F4` border, `rgba(17, 24, 39, 0.05) 0px 12px 34px 0px` shadow; text color defaults to `#111827`

3. **Typography Consistency Rule:** Display headings (H1) are exactly `36.8px` weight `800`; body text is exactly `15.2px` weight `400`; button text is exactly `13.6px` weight `700`; use Plus Jakarta Sans throughout except for code blocks (JetBrains Mono)

4. **Navigation Pattern Rule:** Top navigation bar is `64px` height with transparent background; navigation links use `#111827` color; active/hover state shifts to `#8B5CF6`; secondary navigation items use `10px` border radius with hover background `#EEF0F4`

5. **Spacing Rule:** Apply `24px` vertical spacing between sections; `16px` padding in form fields and inputs; `12px` gap between related elements; `60px` margin between major page sections; maintain minimum `12px` gap between interactive elements

6. **Form Input Rule:** All text inputs use `10px` border radius, `1px solid #DEE2E6` border, `12px 16px` padding; focus state applies `0 0 0 3px rgba(139, 92, 246, 0.1)` box-shadow with border color shift to `#8B5CF6`

7. **Mobile Responsive Rule:** Below `600px`, use full-width buttons (`100%`), single-column layout, collapse navigation to hamburger menu, reduce heading sizes (H1 to `28px`), reduce card padding to `16px`, remove sidebar elements

8. **Semantic Color Rule:** Use `#DC3545` exclusively for errors, `#FFC107` for warnings, `#198754` for success; apply with `0.15` opacity background tint and `4px` left border accent

9. **Shadow Elevation Rule:** Default cards use subtle shadow (`rgba(17, 24, 39, 0.05)`); interactive buttons use purple-tinted shadow (`rgba(139, 92, 246, 0.3)`); hover states increase shadow intensity by `0.1` opacity; never apply shadows to text-only elements

10. **Accessibility Rule:** Maintain minimum contrast ratio of `4.5:1` for body text (`#111827` on `#FFFFFF` = 16.3:1); use semantic HTML; ensure all interactive elements meet `44px × 44px` minimum touch target size; provide visible focus states with `0 0 0 3px rgba(139, 92, 246, 0.1)` on all focusable elements