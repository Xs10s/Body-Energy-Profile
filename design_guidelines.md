# Design Guidelines: Body Energy Profile (Vedic-inspired)

## Design Approach

**System Selection: Material Design with Wellness Refinements**

Rationale: This utility-focused application requires trust, clarity, and information hierarchy. Material Design provides the structured foundation needed for complex data presentation while allowing customization for the wellness/personal insight domain.

Key Principles:
- **Trust through transparency**: Clear methodology, visible disclaimers, professional presentation
- **Information clarity**: Complex scoring data made digestible through hierarchy
- **Personal but not medical**: Warm, approachable tone without clinical sterility
- **Dutch-first design**: All UI elements, labels, and content in Dutch

---

## Typography

**Font System: Inter (via Google Fonts CDN)**

```
Hierarchy:
- Page Titles: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-semibold
- Subsection Headers: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Small Text/Labels: text-sm
- Micro Text (disclaimers): text-xs
```

**Usage Guidelines:**
- Results sections use consistent header → bullets → paragraph → action structure
- Confidence indicators use bold font-weight for emphasis
- Methodology uses slightly smaller text (text-sm) for detailed explanations

---

## Layout System

**Spacing Primitives: Tailwind units of 2, 4, 6, 8, 12, 16, 20**

Container Strategy:
- Landing page: max-w-2xl mx-auto (focused input experience)
- Results page: max-w-4xl mx-auto (room for data visualization)
- Section padding: py-8 md:py-12
- Component spacing: gap-6 or gap-8 between major sections
- Card padding: p-6 md:p-8

**Responsive Breakpoints:**
- Mobile-first always (sm → md → lg)
- Forms stack on mobile, can use 2-column on md+ where logical
- Domain scores grid: 1 column mobile, 2-3 columns tablet+

---

## Component Library

### A. Input Form (Landing Page)
**Layout:** Single-column centered form with clear visual progression

Components:
- Text inputs with floating labels (Material style)
- Date picker with calendar icon trigger
- Time picker with optional toggle ("Ik weet de tijd niet" checkbox)
- Country dropdown with search
- Timezone auto-display (read-only field, subtle background)
- Primary CTA button: large (h-12), full-width on mobile, auto-width on desktop
- Secondary button ("Voorbeeldinvoer"): outlined style

Form validation: Inline error messages beneath fields in small text with icon

---

### B. Results Page Components

**1. Summary Header Card**
- Prominent card at top with user's input data
- Two-column layout (desktop): Left = Birth data, Right = Confidence meter
- Stack on mobile

**2. Confidence Indicator**
Visual treatment:
- High confidence: Progress bar at 90-100% with checkmark icon
- Medium confidence: Progress bar at 60-75% with info icon + explanatory note
- Low confidence: Progress bar at 30-50% with warning icon
- Include expandable "Wat betekent dit?" explanation

**3. Domain Scores Visualization**
Grid layout (1/2/3 columns responsive):
- Each domain as a card with:
  - Domain name + icon (chakra symbol or abstract icon)
  - Score value (large number, text-3xl)
  - If time unknown: show range "48-56" in subtle text
  - "Tijdgevoelig" badge if spread ≥ 10
  - Horizontal bar indicator showing score position (0-100 scale)

**4. Section Cards (8 sections)**
Consistent structure per section:
- Section header with icon
- Bullet points (ul with custom markers, gap-3)
- Paragraph in regular weight, slightly muted
- "Volgende stap" highlighted in a subtle callout box (border-l-4 accent, pl-4, py-3)

**5. Methodology Accordion**
Collapsible panel:
- Closed state: "Bekijk methodologie" with chevron
- Open state: Short explanation + detailed list
- Uses expansion panel pattern

**6. Disclaimer Box**
Prominent placement at bottom of results:
- Warning icon
- Clear disclaimer text
- "Wanneer een professional raadplegen" list
- Distinct visual treatment (border, slightly different background tone)

**7. Action Buttons Row**
Sticky or fixed at bottom (mobile) / top-right (desktop):
- "Download PDF" (primary)
- "Profiel opslaan" (secondary)
- "Invoer aanpassen" (tertiary/text button)

---

### C. History Page (Optional)
Table/list view:
- Each row: Name | Datum aangemaakt | Confidence | "Bekijk" button
- Sort by date (newest first)
- Empty state: Centered illustration + "Nog geen profielen opgeslagen"

---

## Accessibility Implementation

- All form inputs have explicit labels (not just placeholders)
- Focus states: visible outline with offset for all interactive elements
- Skip navigation link for keyboard users
- ARIA labels for icon-only buttons
- Sufficient contrast ratios throughout (AA compliance minimum)
- Semantic HTML: proper heading hierarchy, landmark regions

---

## Animations

**Minimal, purposeful motion:**
- Page transitions: Simple fade (200ms)
- Accordion expand/collapse: Smooth height transition (300ms ease)
- Form validation: Gentle shake on error (200ms)
- Confidence meter: Animated fill on results load (600ms ease-out)
- NO scroll-triggered animations, parallax, or decorative motion

---

## Images

**No hero images for this application.** The landing page is input-focused and should feel like a trusted tool, not a marketing experience. The results page is data-dense.

**Icons only:**
- Domain/chakra icons (abstract, geometric - use Material Icons or Heroicons)
- Form field icons (calendar, clock, location)
- Confidence indicators (checkmark, info, warning)
- Section header icons (one per 8 sections)

---

## Key Interactions

- Form auto-saves to localStorage (subtle indicator)
- Time field: Disable when "Ik weet de tijd niet" is checked, smooth transition
- Timezone: Auto-updates based on place selection (with loading state)
- PDF generation: Show loading state with percentage indicator
- Collapsible sections: Remember state in session storage

---

**Design Philosophy:** Clean, trustworthy, information-rich without overwhelming. Every element earns its place by serving user understanding of their personalized body energy profile.