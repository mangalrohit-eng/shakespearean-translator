# UI/UX ITERATION 2 - Typography, Spacing & Visual Hierarchy

## 🎯 Focus Areas

### 1. Typography Refinement
- ⚠️ **Line Heights**: Some sections too tight, especially in tables
- ⚠️ **Font Weights**: Mix of 400, 500, 600, 700 - need consistency
- ⚠️ **Letter Spacing**: Headers need refinement (-0.02em to -0.03em)
- ⚠️ **Font Sizes**: Some headings too similar (need better hierarchy)
- ⚠️ **Paragraph Spacing**: Body text needs more breathing room

### 2. Visual Hierarchy & Depth
- ⚠️ **Card Shadows**: Some cards flat, need elevation system
- ⚠️ **Border Colors**: All using #E0E0E0 - need subtle variations
- ⚠️ **Background Layers**: Need more depth distinction
- ⚠️ **Z-index System**: No documented stacking context
- ⚠️ **Hover States**: Cards need better elevation change

### 3. Spacing Consistency
- ⚠️ **Section Margins**: 32px, 40px, 48px, 64px - need system (8px base)
- ⚠️ **Card Padding**: 20px, 24px, 28px, 32px - inconsistent
- ⚠️ **Grid Gaps**: 16px, 20px, 24px - need standardization
- ⚠️ **Container Padding**: 40px, 60px - responsive issues

### 4. Table Improvements
- ⚠️ **Row Height**: Too cramped (16px padding)
- ⚠️ **Column Alignment**: Some numbers not right-aligned
- ⚠️ **Borders**: All rows have borders - too busy
- ⚠️ **Sticky Headers**: Table headers should stick on scroll
- ⚠️ **Zebra Striping**: No alternating row colors

### 5. Form & Input Polish
- ⚠️ **Focus Rings**: Generic browser focus - need custom
- ⚠️ **Input Heights**: 48px for mobile touch targets
- ⚠️ **Label Positioning**: Inline vs floating inconsistent
- ⚠️ **Error States**: No visual error styling
- ⚠️ **Validation**: No inline validation feedback

### 6. Color Refinement
- ⚠️ **Hardcoded Colors**: Still some #F8F8F8, #FAFAFA
- ⚠️ **Gradient Overuse**: Too many gradients in buttons
- ⚠️ **Tag Colors**: Need pastel versions for better contrast
- ⚠️ **Disabled States**: Not consistent across components

## 📋 Implementation Plan

### Phase 1: Typography System (30 min)
1. Define font scale (12, 14, 16, 18, 20, 24, 32, 44, 56px)
2. Set line-heights (1.2 headings, 1.5 body, 1.6 long-form)
3. Standardize font-weights (400 normal, 500 medium, 600 semibold, 700 bold)
4. Update letter-spacing system
5. Apply to all headings and body text

### Phase 2: Spacing System (20 min)
6. Create spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96px)
7. Replace all hardcoded margins with scale
8. Standardize padding across cards
9. Fix container responsive padding
10. Update grid gaps to use scale

### Phase 3: Shadow & Depth (15 min)
11. Create elevation system (4 levels)
12. Apply to cards, modals, dropdowns
13. Add hover elevation transitions
14. Define z-index layers

### Phase 4: Table Polish (20 min)
15. Increase row padding to 20px
16. Add zebra striping (subtle)
17. Make headers sticky
18. Improve hover states
19. Right-align numbers

### Phase 5: Forms & Inputs (25 min)
20. Custom focus rings (purple outline)
21. Increase input heights to 48px
22. Add error/success states
23. Improve disabled styling
24. Add input icons

### Phase 6: Color Consolidation (10 min)
25. Replace all hardcoded colors
26. Create CSS variables for all shades
27. Refine tag color palette
28. Standardize disabled states

## 🎯 Success Metrics
- ✅ Zero hardcoded colors
- ✅ All spacing uses 8px base grid
- ✅ Consistent typography scale
- ✅ 4-level elevation system
- ✅ All tables scrollable with sticky headers
- ✅ All inputs 48px+ for mobile
- ✅ Custom focus states everywhere


