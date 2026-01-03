# WordCraft Design System

**Pink-Centric Style** — A warm, energetic, and playful aesthetic built on rosy foundations.

## Core Identity

| Token               | Value     | Description               |
| ------------------- | --------- | ------------------------- |
| `--accent-pink-500` | `#ec4899` | **Hero Color** — Hot Pink |

## Light Mode Palette

| Token           | Value     | Description                       |
| --------------- | --------- | --------------------------------- |
| `--l-bg`        | `#ffffff` | Background (Pure White)           |
| `--l-fg`        | `#2d1e24` | Foreground (Warm Black)           |
| `--l-primary`   | `#1f0f16` | Primary text                      |
| `--l-secondary` | `#fff1f7` | Secondary Background (Pale Blush) |
| `--l-muted`     | `#8a7480` | Muted Text (Rosy Gray)            |
| `--l-border`    | `#fce7f3` | Borders (Pink Tint)               |

## Dark Mode Palette

| Token           | Value     | Description                               |
| --------------- | --------- | ----------------------------------------- |
| `--d-bg`        | `#1f0f16` | Background (Deep Burgundy)                |
| `--d-fg`        | `#fff0f7` | Foreground (Pale Pink White)              |
| `--d-primary`   | `#fff0f7` | Primary text                              |
| `--d-secondary` | `#3d2932` | Secondary Background (Deep Rose Charcoal) |
| `--d-muted`     | `#bba3af` | Muted Text (Light Rosy Gray)              |
| `--d-border`    | `#3d2932` | Borders (Dark Rose)                       |

## Semantic Colors

### Destructive / Error

| Token               | Value     |
| ------------------- | --------- |
| `--sem-destructive` | `#ef4444` |

### Chart & Data Visualization

| Token           | Value     | Description |
| --------------- | --------- | ----------- |
| `--sem-chart-1` | `#f87171` | Coral       |
| `--sem-chart-2` | `#34d399` | Emerald     |
| `--sem-chart-3` | `#60a5fa` | Navy Blue   |
| `--sem-chart-4` | `#fbbf24` | Yellow      |
| `--sem-chart-5` | `#fb923c` | Orange      |

## Typography

- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 400, 500, 600, 700, 900

### Heading Styles

| Element | Weight | Size   |
| ------- | ------ | ------ |
| `h1`    | 900    | 3rem   |
| `h2`    | 700    | 1.5rem |
| `h3`    | 600    | 1.1rem |
| `h4`    | 600    | 1.1rem |

## UI Components

### Feature Card

- **Background**: `--l-bg`
- **Border**: `1px solid var(--l-border)`
- **Padding**: 24px
- **Border Radius**: 16px
- **Shadow**: `0 10px 30px -10px rgba(236, 72, 153, 0.15)`
- **Width**: 240px

### Icon Box (Feature Card)

- **Size**: 48px × 48px
- **Border Radius**: 12px
- **Gradient**: `linear-gradient(135deg, var(--accent-pink-500), #be185d)`
- **Shadow**: `0 8px 20px -6px rgba(236, 72, 153, 0.5)`

### Buttons

| Type        | Background          | Text Color          | Border                      | Shadow                               |
| ----------- | ------------------- | ------------------- | --------------------------- | ------------------------------------ |
| Primary     | `--accent-pink-500` | White               | None                        | `0 4px 12px rgba(236, 72, 153, 0.3)` |
| Secondary   | `--l-secondary`     | `--accent-pink-500` | `1px solid var(--l-border)` | None                                 |
| Destructive | `--sem-destructive` | White               | None                        | None                                 |

- **Padding**: 12px × 24px
- **Border Radius**: 10px
- **Font Weight**: 600
- **Hover (Primary)**: `translateY(-1px)`, shadow becomes `0 6px 16px rgba(236, 72, 153, 0.5)`

### Tags / Pills

- **Background**: `#fce7f3`
- **Text Color**: `#be185d` (Pink-700)
- **Border**: `1px solid #fbcfe8`
- **Padding**: 8px × 16px
- **Border Radius**: 24px
- **Font Size**: 0.9rem
- **Font Weight**: 600

### Form Input

| State    | Border              | Border Width | Shadow                              |
| -------- | ------------------- | ------------ | ----------------------------------- |
| Inactive | `--l-border`        | 1px          | None                                |
| Active   | `--accent-pink-500` | 2px          | `0 0 0 3px rgba(236, 72, 153, 0.2)` |

- **Border Radius**: 10px
- **Padding**: 12px × 16px

## Spacing System

- **Card Padding**: 24px
- **Button Padding**: 12px × 24px
- **Input Padding**: 12px × 16px
- **Card Border Radius**: 16px
- **Button/Input Border Radius**: 10px

## Shadows

| Usage                | Value                                        |
| -------------------- | -------------------------------------------- |
| Primary Button       | `0 4px 12px rgba(236, 72, 153, 0.3)`         |
| Primary Button Hover | `0 6px 16px rgba(236, 72, 153, 0.5)`         |
| Feature Card         | `0 10px 30px -10px rgba(236, 72, 153, 0.15)` |
| Input Focus          | `0 0 0 3px rgba(236, 72, 153, 0.2)`          |

## Related Resources

- **Visual Prototype**: [`ui-design/design.html`](ui-design/design.html) — Open in browser to preview the complete design system
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
