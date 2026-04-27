---
description: Guidelines for modal and popup component responsiveness
---

# Modal Responsiveness Guidelines

## Critical Rules (MUST FOLLOW)

### 1. Navbar Spacing
- All modals MUST have `pt-20 sm:pt-24` or equivalent top padding to avoid overlapping with the navbar
- The navbar is approximately 64-80px tall on desktop and ~64px on mobile
- Never use just `items-center` without top padding

### 2. Screen Edge Padding  
- Always add `p-4` at minimum to prevent modal from touching screen edges on mobile
- For desktop, use `sm:p-6` or larger

### 3. Responsive Modal Wrapper Pattern
```jsx
<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 sm:pt-24 animate-in fade-in duration-300">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
  
  {/* Modal Content */}
  <div className="relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
    {/* Your modal content */}
  </div>
</div>
```

### 4. z-index Standards
- Navbar: z-50
- Regular modals: z-[9999]
- AI Companion: z-[9998] (FAB) and z-[9999] (modal)
- Mobile menu backdrop: z-[9998]

### 5. Body Scroll Lock
All modals MUST lock body scroll when open:
```jsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isOpen]);
```

### 6. Maximum Heights
- Use `max-h-[80vh]` or similar to prevent modal from exceeding viewport height
- Always include `overflow-y-auto` for scrollable content areas

## Existing Modal Files to Reference
- `/components/ui/Modal.jsx` - Standard info modal
- `/components/ui/ConfirmModal.jsx` - Confirmation dialogs
- `/components/momentum/ToolActionModal.jsx` - Full-page tool viewer
- `/components/OpportunityStudio.jsx` - Course insights modal
- `/components/homepage/IntentNavigator.js` - Intent input modal
- `/components/AICompanion.jsx` - Floating chat modal

## Testing Checklist
- [ ] Verify modal doesn't touch navbar on desktop (1024px+)
- [ ] Verify modal doesn't touch navbar on tablet (768px)
- [ ] Verify modal has margins on mobile (375px)
- [ ] Verify body scroll is locked when modal is open
- [ ] Verify Escape key closes the modal
- [ ] Verify backdrop click closes the modal
