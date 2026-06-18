---
name: Sonic Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#424656'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#00677f'
  on-secondary: '#ffffff'
  secondary-container: '#00ccf9'
  on-secondary-container: '#005266'
  tertiary: '#4345d1'
  on-tertiary: '#ffffff'
  tertiary-container: '#5d60eb'
  on-tertiary-container: '#faf6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 80px
---

## Brand & Style

The brand personality is authoritative yet innovative, positioning itself as a high-tier technical partner for AI and software engineering. It targets enterprise leaders and tech-forward startups who value scalability and tangible results. 

The design style is **Corporate / Modern** with a strong infusion of **Glassmorphism**. It utilizes clean layouts and high-quality typography to establish trust, while leveraging vibrant gradients, subtle backdrop blurs, and layered depth to signal cutting-edge technological capabilities. The UI should evoke a sense of clarity, speed, and structural integrity.

## Colors

The palette is anchored by a high-energy primary blue (#0066FF) that drives action and focus. This is supported by a secondary cyan and tertiary indigo to create the "tech-forward" gradients seen in the branding. 

Neutrals are sophisticated cool-grays, moving from a deep slate for primary headings to a soft, airy gray for container backgrounds. Success and highlight states utilize the secondary cyan. The default mode is light, emphasizing a "clean slate" aesthetic with generous white space.

## Typography

This design system uses a dual-font strategy. **Plus Jakarta Sans** is used for headlines and display text to provide a modern, slightly geometric character that feels premium. **Inter** is used for body copy and UI labels to ensure maximum legibility and a systematic, professional feel.

Hierarchy is established through significant weight contrast (Extrabold for headlines vs. Regular for body) and tight letter spacing on larger display roles to maintain a compact, high-impact look.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a maximum container width of 1280px for desktop. It utilizes a 12-column system where spacing between elements (gutters) is fixed at 24px to maintain a rigid structural rhythm.

Spacing is designed with a "density of information" approach: large vertical gaps (80px+) between major sections to provide breathing room, and tight, functional spacing (8px-16px) within component groups like cards or button sets. On mobile, margins reduce to 16px and multi-column layouts reflow into a single-column stack.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Ambient Shadows**. Instead of traditional heavy shadows, this design system uses:
1.  **Level 0 (Base):** Pure white or ultra-light gray (#F8FAFC).
2.  **Level 1 (Cards):** Thin, low-contrast borders (1px solid #E2E8F0) with a very diffused 4% opacity shadow.
3.  **Level 2 (Modals/Popovers):** Semi-transparent white backgrounds with a backdrop-filter blur (12px) and a subtle 8% opacity shadow to create a glass effect.

Gradients are used sparingly on interactive surfaces to suggest they sit "above" the static content.

## Shapes

The shape language is consistently **Rounded**. A base radius of 0.5rem (8px) is applied to standard buttons and inputs. Larger containers, such as feature cards or the main hero visual wrappers, use `rounded-xl` (1.5rem / 24px) to create a friendly, modern tech aesthetic. Avoid sharp corners entirely to maintain the approachable brand voice.

## Components

-   **Buttons:** Primary buttons use the `gradient_primary` with white text and a small "arrow-up-right" icon for external actions. Secondary buttons use a transparent background with a 1px primary blue border.
-   **Cards:** Use a white background, `rounded-xl` corners, and a subtle 1px border. Feature cards may include a soft blue gradient top-border (2px).
-   **Chips/Badges:** Small, `pill-shaped` containers with light blue backgrounds (#EFF6FF) and bold primary blue text for categories or status indicators.
-   **Input Fields:** Ghost-style inputs with light gray borders that transition to a 2px primary blue border on focus.
-   **Lists:** Items are separated by generous vertical padding (12px) and often use custom iconography instead of standard bullets to reinforce the technical theme.
-   **Visual Nodes:** For diagrams, use circular containers with soft glow effects (box-shadow: 0 0 15px rgba(0, 102, 255, 0.2)) to signify "AI units" or "data points."