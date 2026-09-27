---
name: Predictive Campus Mobility
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464554'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#006948'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855d'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system drives a modern academic ridesharing platform that connects university students and faculty through predictive route optimization. The visual language balances institutional trustworthiness with forward-looking intelligence.

- **Personality:** Analytical, dependable, welcoming, and technologically refined.
- **Target Audience:** University students, researchers, and campus faculty requiring secure, effortless, and sustainable daily commutes.
- **Emotional Response:** Confidence in safety and verification, collective environmental responsibility, and effortless speed powered by predictive intelligence.
- **Design Movement:** Modern Clean Functionalism with Ambient Intelligence accents. Generous whitespaces, crisp structural boundaries, and subtle atmospheric indigo glows communicate predictive algorithmic matching without visual noise.

## Colors

The palette organizes functional hierarchy, institutional trust, and computational intelligence:

- **Primary (`#6366F1` - Predictive Indigo):** Designates machine learning actions, ride route optimizations, predictive matching scores, and proactive suggestions.
- **Secondary (`#1E3A8A` - Institutional Blue):** Grounds the interface in safety, institutional affiliation, verified profiles, and core navigation chrome.
- **Tertiary (`#059669` - Eco Emerald):** Highlights carbon offset metrics, confirmed carpools, punctual departure statuses, and success feedback.
- **Neutral Palette:**
  - Base Background: `#F8FAFC`
  - Elevated Container: `#FFFFFF`
  - Subtle Dividing Borders: `#E2E8F0`
  - Secondary Text / Icons: `#64748B`
  - High-Contrast Text / Dominant Titles: `#0F172A`

Light mode serves as the primary canvas to ensure clarity under direct daylight across campus transit areas. Darker contrast layers are reserved for tactile, bottom-oriented interactive components.

## Typography

Typography prioritizes scanability on handheld devices on the move:

- **Headlines (`Outfit`):** Geometric, precise, and contemporary. Its open apertures reinforce clarity across route headlines, campus hubs, and departure clocks.
- **Body & Labels (`Hanken Grotesk`):** Clean and structurally robust. The minimum default running size is set to `16px` (`body-md`) to ensure effortless legibility under varying lighting conditions.
- **Rules:**
  - Critical numerical values (arrival times, fare shares, seat counts) use medium-to-bold weights with tabular figures where applicable.
  - Informative subtext must never render below `13px` (`caption`), maintaining strict accessibility thresholds.

## Layout & Spacing

The layout model emphasizes thumb-zone ergonomics for one-handed operational comfort during urban transit:

- **Grid Architecture:** 4-column fluid layout on mobile, transitioning to 8 columns on tablet and 12 columns on desktop viewports.
- **Reachability Zones:** Interactive anchors, primary matching controls, bottom sheets, and route filters are grouped within the lower 50% of the viewport. Visual context (map telemetry, institutional badges) occupies the upper half.
- **Rhythm & Dimensions:** Vertical spacing operates on a baseline 8px module. Interactive touch targets adhere to a minimum size of 48px to 56px (`h-12` to `h-14`) to prevent miss-clicks while in transit.

## Elevation & Depth

Spatial layering distinguishes contextual map surfaces from interactive booking layers:

- **Layer 0 (Canvas):** `#F8FAFC`, flat ground containing the base map canvas and structural route lines.
- **Layer 1 (Cards & Modules):** Pure `#FFFFFF` resting on surface borders (`1px solid #E2E8F0`) paired with subtle ambient diffusion: `0 2px 8px -2px rgba(15, 23, 42, 0.04)`.
- **Layer 2 (Floating Action Trays & Bottom Sheets):** `#FFFFFF` paired with an elevated directional shadow: `0 12px 32px -4px rgba(15, 23, 42, 0.08)`.
- **Layer 3 (Predictive AI Highlights):** Cards featuring predictive matches introduce an ambient tinted glow: `0 8px 24px -4px rgba(99, 102, 241, 0.16)` alongside a 1px border colored in semi-opaque indigo (`rgba(99, 102, 241, 0.25)`).

## Shapes

The interface balances welcoming curves with structural integrity:

- **Standard Elements (`roundedness: 2` - 0.5rem / 8px):** Form fields, route timeline indicators, and secondary utility badges.
- **Interactive Surfaces (`rounded-lg` - 1rem / 16px):** Trip detail cards, driver bio panels, and action sheets.
- **Prominent Modules (`rounded-xl` - 1.5rem / 24px):** Bottom modal sheets and AI match hero cards.
- **Pills (`rounded-full`):** Status indicator tags, seat count avatars, and floating micro-controls.

## Components

- **Buttons:**
  - *Primary (Action):* Height 52px (`h-13`) to 56px (`h-14`), full width or lower-pinned. Indigo base (`#6366F1`) or Deep Blue (`#1E3A8A`) with white text, font `label-lg`, and rounded corners (16px).
  - *Predictive AI Action:* Graded accent button with indigo-to-purple subtle gradient, marked by a spark icon and 52px height.
  - *Secondary / Outline:* Translucent surface with a 1px border (`#E2E8F0`), active state shifting to `#F1F5F9`.

- **Predictive Match & Status Chips:**
  - *AI Recommendation Chip:* Subtle indigo background (`rgba(99, 102, 241, 0.1)`), indigo label (`#6366F1`), adorned with micro-confidence score ("98% compatível").
  - *Status Chip:* Emerald background tint with `#059669` typography for confirmed departures; slate tint for pending status.

- **Ride Cards:**
  - Background `#FFFFFF`, rounded 16px (`rounded-lg`), padded with `space-md` (16px).
  - Features driver verification icon (Academic Blue), pickup ETA, remaining seats visualizer, and route corridor visualizer.

- **Input Fields:**
  - Height 52px minimum. Background `#F8FAFC`, border `1px solid #E2E8F0`, transitioning to `2px solid #6366F1` on focus. Placeholder text in `#64748B`.

- **Lists & Timeline Steps:**
  - Route stepping nodes connected by vertical 2px continuous dashed lines (`#CBD5E1`). Active dropoff hubs highlighted in emerald (`#059669`).

- **Verification & Safety Badges:**
  - Academic credentials verified through an institutional pill badge combining a university shield icon, uppercase department or campus tag, and `#1E3A8A` tint.