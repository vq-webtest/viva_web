---
name: Clinical Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#44474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777e'
  outline-variant: '#c5c6ce'
  surface-tint: '#4e5f7c'
  primary: '#00030a'
  on-primary: '#ffffff'
  primary-container: '#0a1d37'
  on-primary-container: '#7586a5'
  inverse-primary: '#b6c7e9'
  secondary: '#006971'
  on-secondary: '#ffffff'
  secondary-container: '#76f1ff'
  on-secondary-container: '#006d76'
  tertiary: '#070200'
  on-tertiary: '#ffffff'
  tertiary-container: '#301700'
  on-tertiary-container: '#a67d59'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b6c7e9'
  on-primary-fixed: '#081c36'
  on-primary-fixed-variant: '#364763'
  secondary-fixed: '#87f3ff'
  secondary-fixed-dim: '#59d8e5'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f55'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#edbd95'
  on-tertiary-fixed: '#2e1600'
  on-tertiary-fixed-variant: '#604021'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  scientific-orange: '#F79C2C'
  clinical-blue: '#E2E8F0'
  deep-navy: '#050E1B'
  data-error: '#FF3A2D'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  button:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-margin: 2rem
  gutter: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
  section-padding: 5rem
---

## Brand & Style

The design system is engineered for the pharmaceutical and life sciences sector, where trust, accuracy, and professional integrity are paramount. It targets healthcare professionals, procurement officers, and researchers who require immediate access to complex technical data.

The visual style is **Corporate / Modern** with a strong emphasis on **Minimalism**. It utilizes expansive white space to denote cleanliness and a clinical atmosphere. The aesthetic prioritizes information density and legibility over decorative elements, ensuring that the "Viva Quest" brand is perceived as an established, reliable authority in the pharmaceutical market. Key attributes include high-strength typography, a restricted professional palette, and organized, grid-based information architecture.

## Colors

The palette is anchored by **Deep Navy Blue**, providing a stable, institutional foundation. **Sterile White** (#FFFFFF) and light grays are used for surfaces to maintain a laboratory-fresh feel.

- **Primary (Deep Navy):** Used for navigation bars, primary headings, and high-level structural components.
- **Secondary (Teal):** Used for primary actions, success states, and indicating progress.
- **Accent (Scientific Orange):** Reserved for critical call-to-actions, notifications, or highlighting specific chemical/product categories to draw the eye without breaking the professional tone.
- **Neutrals:** A range of cool-tinted grays are employed to separate data sections and create a clear hierarchy in complex tables.

## Typography

This design system uses a dual-sans-serif approach to balance corporate authority with technical precision.

- **Headlines (Manrope):** A modern, geometric sans-serif that conveys stability and contemporary professionalism. High-level headers use a tighter letter-spacing for a "locked-in" editorial look.
- **Body & Interface (Inter):** Chosen for its exceptional legibility in UI applications and dense data environments. It remains clear at small sizes within multi-column grids.
- **Technical Labels (JetBrains Mono):** Used sparingly for CAS numbers, chemical IDs, and SKU codes. The monospaced nature helps users quickly compare alphanumeric strings for accuracy.

## Layout & Spacing

The design system utilizes a **12-column fixed grid** (max-width 1280px) for desktop to ensure content remains readable and focused.

### Layout Rules

- **Product Catalogs:** Use a structured 3 or 4-column grid with consistent card heights.
- **Data Tables:** Horizontal density is prioritized. Row heights are kept at a "Compact" level (48px) to maximize the amount of visible data on one screen.
- **Breakpoints:**
  - *Mobile (<768px):* 4-column fluid grid, 16px margins.
  - *Tablet (768px - 1024px):* 8-column fluid grid, 24px margins.
  - *Desktop (>1024px):* 12-column fixed grid, 32px margins.

Spacing follows an 8px base unit to maintain a strict mathematical rhythm across the interface.

## Elevation & Depth

To maintain a "clinical" and "sterile" feel, elevation is used with extreme restraint. We avoid heavy shadows in favor of **Tonal Layers** and **Low-contrast outlines**.

- **Level 0 (Background):** The base sterile white or very light gray (#F8FAFC) surface.
- **Level 1 (Cards/Tables):** Defined by a 1px solid border in `#E2E8F0`. No shadow.
- **Level 2 (Hover states/Dropdowns):** A subtle, ultra-diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) is used to indicate interactivity without creating visual "noise."
- **Interactive Elements:** Use subtle background color shifts (e.g., a 5% darker tint of the neutral color) to indicate depth rather than vertical lift.

## Shapes

The shape language is **Soft** but disciplined.

- **Standard Components:** Buttons, inputs, and cards use a 4px (0.25rem) radius. This provides a modern touch while maintaining the "square" feel of professional, scientific documentation.
- **Iconography:** Use line-based icons with a 2px stroke weight. Avoid filled icons unless used for active navigation states.
- **Data Tags:** Status pills (e.g., "In Stock", "API") may use a slightly more rounded 8px radius to differentiate them from functional UI buttons.

## Components

### Buttons

- **Primary:** Deep Navy background with White text. Sharp corners (4px).
- **Secondary:** Transparent background with Navy border.
- **Ghost:** Teal text with no background, used for secondary table actions like "Download COA."

### Data Tables

- **Header:** Light gray (#F1F5F9) background, Uppercase labels in JetBrains Mono at 12px.
- **Rows:** Alternating "zebra" stripes are prohibited. Use a thin 1px bottom border only.
- **Hover:** Highlight row in a very soft teal-white (#F0FDFA).

### Input Fields

- Underlined style or fully boxed with 1px border.
- Active state: 1px teal border with a soft teal outer glow.
- Labels: Always positioned above the field for maximum legibility.

### Grid Navigation

- Category cards (e.g., "Nutraceuticals", "API") should feature a large, centered icon or chemical structure graphic, a clear headline, and a "View Products" chevron.
- Content is strictly center-aligned within the grid items to create a gallery-like professional feel.
