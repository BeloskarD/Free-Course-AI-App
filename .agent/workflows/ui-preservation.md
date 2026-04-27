---
description: Core principles for maintaining existing UI when adding new features
---

# UI Preservation & Responsive Design Guidelines

## Golden Rule
**NEVER modify existing logic or UI when adding new features.** All changes must be ADDITIVE and must not break existing functionality, styling, or responsiveness.

---

## Core Principles

### 1. Non-Destructive Development
- New features should be added WITHOUT modifying existing code behavior
- If modification is required, ensure backward compatibility
- Always test affected pages/components after additions

### 2. Responsiveness Requirements
Every component MUST be responsive across all screen sizes:
- Mobile: 320px - 480px
- Tablet: 481px - 768px  
- Small Desktop: 769px - 1024px
- Desktop: 1025px+

### 3. Breakpoint Standards (Tailwind)
```
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1536px - Large screens
```

---

## Before Adding Any New Feature

### Checklist:
- [ ] Does this change affect any existing component?
- [ ] Have I tested the affected pages on mobile, tablet, and desktop?
- [ ] Does the new component follow the existing design system (colors, fonts, spacing)?
- [ ] Does it respect z-index hierarchy? (see `/modal-responsiveness.md`)
- [ ] Does it work in both light and dark themes?
- [ ] Is scroll behavior properly handled?

---

## Design System Reference

### Colors (use CSS variables)
- `--site-bg` - Background color
- `--site-text` - Primary text
- `--site-text-muted` - Secondary/muted text
- `--card-bg` - Card background
- `--card-border` - Card borders
- `--accent-primary` - Primary accent (indigo)

### Spacing Standards
- Container: `max-w-6xl` or `max-w-7xl`
- Section padding: `py-20` or `py-40`
- Card padding: `p-6` or `p-8`
- Component gaps: `gap-4` to `gap-8`

### Border Radius Standards
- Small elements: `rounded-lg` or `rounded-xl`
- Cards: `rounded-[2rem]` or `rounded-[3rem]`
- Buttons: `rounded-xl` to `rounded-3xl`
- Modals: `rounded-[2.5rem]` to `rounded-[3rem]`

### Typography
- Font family: System default (no custom fonts)
- Headings: `font-black`, `tracking-tight` or `tracking-tighter`
- Body: `font-medium` or `font-bold`
- Small text: `text-xs`, `font-semibold`

---

## Testing Protocol

### After Every Change:
1. **Mobile Test** (375px viewport)
   - Check navbar doesn't overlap content
   - Check modals have proper margins
   - Check text is readable
   - Check buttons are tappable (min 44px)

2. **Tablet Test** (768px viewport)
   - Check grid layouts adapt correctly
   - Check modals are properly centered
   - Check navigation works

3. **Desktop Test** (1920px viewport)
   - Check content doesn't stretch too wide
   - Check hover states work
   - Check animations are smooth

4. **Theme Test**
   - Switch between light and dark mode
   - Verify all text is visible in both modes

---

## Common Mistakes to Avoid

1. ❌ Using fixed widths (e.g., `w-[400px]`) without responsive alternatives
2. ❌ Hardcoding colors instead of using CSS variables
3. ❌ Forgetting `overflow-hidden` or `overflow-auto` on containers
4. ❌ Not testing on actual mobile devices or small viewports
5. ❌ Adding z-index higher than 9999 (reserved for modals)
6. ❌ Modifying existing files without understanding full impact

---

## File Organization
- `/components/ui/` - Reusable UI components (Modal, Button, etc.)
- `/components/homepage/` - Homepage-specific components
- `/components/momentum/` - Progress/tracking components
- `/components/` - General/shared components
- `/app/` - Page routes (Next.js App Router)

---

## Emergency Recovery
If a change breaks existing UI:
1. Git revert the specific commit
2. Review the change in isolation
3. Test on multiple screen sizes before re-applying
4. Ask for review if unsure
