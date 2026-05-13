# Migration Guide: From Old Frontend to Refactored ServicePro Frontend

This guide helps you migrate from the previous ServicePro frontend implementation to the new WCAG-compliant refactored version.

## 📋 Overview of Changes

### Major Improvements
1. **Accessibility**: Full WCAG 2.1 Level AA compliance
2. **Design**: Modern, clean interface matching visual mockups
3. **Code Quality**: Better structure, TypeScript strict mode
4. **Performance**: Optimized components and lazy loading
5. **Testing**: Built-in accessibility testing

### Breaking Changes
- Sidebar styling completely redesigned
- Color scheme updated from dark theme to light theme
- Component API changes for better accessibility
- Folder structure reorganized

## 🔄 Migration Steps

### Step 1: Backup Old Project
```bash
cp -r src src.backup
```

### Step 2: Update Dependencies

Remove old dependencies and install new ones:

```bash
npm install --save-dev @tailwindcss/forms
npm install --save-dev postcss autoprefixer
npm remove [any old UI libraries]
```

Your final `package.json` dependencies should match the provided version.

### Step 3: Replace Core Files

#### 1. Replace Sidebar Component
**Old**: `src/components/layout/Sidebar.tsx`
**New**: Use the refactored version from `src/components/Sidebar.tsx`

Key differences:
- Light theme instead of dark
- Better ARIA labels and semantic structure
- Improved keyboard navigation
- New menu structure

#### 2. Replace Layout Structure
**Old**: Basic flex layout
**New**: Use the new `Layout.tsx` component wrapper

```typescript
// Before
export default function Page() {
  return (
    <div className="flex">
      <Sidebar />
      <div>...</div>
    </div>
  );
}

// After
export default function Page() {
  return (
    <Layout>
      <YourContent />
    </Layout>
  );
}
```

#### 3. Update Table Components
Replace old table implementations with new accessible versions:

```typescript
// Before
import { InventoryTable } from '@/src/features/inventory/components';

// After
import { InventoryTable } from '@/src/components/InventoryTable';
```

### Step 4: Update Colors and Styling

#### Color Scheme Changes
Replace these in your CSS/Tailwind:

```css
/* Old (dark theme) */
bg-slate-900 → bg-white
text-slate-300 → text-gray-600
border-slate-800 → border-gray-200

/* New (light theme) */
bg-blue-600 → bg-blue-600 (same)
text-white → text-white (same)
```

#### Update Color Variables in globals.css
Copy the new color configuration from the refactored `globals.css` file.

### Step 5: Migrate Data Pages

#### Dashboard Page
```typescript
// Old location: src/pages/dashboard.tsx
// New location: src/pages/DashboardPage.tsx

// Update imports in your route handler
import { DashboardPage } from '@/src/pages/DashboardPage';
```

#### Inventory Page
```typescript
// Old location: src/features/inventory/pages
// New location: src/pages/InventoryPage.tsx
```

#### Service Requests Page
```typescript
// Old location: src/features/service-request/pages
// New location: src/pages/ServiceRequestPage.tsx
```

### Step 6: Update API Integration

The refactored components use the same data types but may have slightly different prop interfaces.

#### Example: InventoryTable Props

```typescript
// Old
interface InventoryTableProps {
  items: SparePart[];
  loading?: boolean;
  onRowClick?: (item: SparePart) => void;
}

// New
interface InventoryTableProps {
  items: SparePart[];
  onSort?: (column: string) => void;
  loading?: boolean;
}

// Update your usage:
<InventoryTable 
  items={parts}
  onSort={handleSort}
  loading={isLoading}
/>
```

### Step 7: Update Routes

Update your Next.js routing to use the new page structure:

```typescript
// pages/index.tsx or app/page.tsx
import { DashboardPage } from '@/src/pages/DashboardPage';

export default function Home() {
  return <DashboardPage />;
}

// pages/inventory.tsx or app/inventory/page.tsx
import { InventoryPage } from '@/src/pages/InventoryPage';

export default function Inventory() {
  return <InventoryPage />;
}

// pages/service-requests.tsx or app/service-requests/page.tsx
import { ServiceRequestPage } from '@/src/pages/ServiceRequestPage';

export default function ServiceRequests() {
  return <ServiceRequestPage />;
}
```

### Step 8: Update CSS

1. Replace your global CSS with the new `globals.css`
2. Update `tailwind.config.ts` with the new configuration
3. Remove any custom theme overrides that conflict

### Step 9: TypeScript Configuration

Ensure your `tsconfig.json` has these settings for accessibility:

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🧪 Testing the Migration

### 1. Visual Testing
- [ ] Open each page in browser
- [ ] Verify layout matches design mockups
- [ ] Check responsive behavior on mobile/tablet
- [ ] Verify colors and contrast

### 2. Functional Testing
- [ ] All buttons are clickable
- [ ] Forms submit correctly
- [ ] Tables display data properly
- [ ] Filters work as expected
- [ ] Navigation works in sidebar

### 3. Accessibility Testing
```bash
# Run accessibility audit
npm run test:a11y

# Keyboard navigation test
# - Tab through entire page
# - Shift+Tab to go backwards
# - Verify all interactive elements reachable
```

### 4. Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] Verify headings announced properly
- [ ] Verify form labels are associated

### 5. Performance Testing
```bash
npm run build
npm run analyze
```

## 🐛 Common Issues and Solutions

### Issue 1: Styling Not Applied
**Cause**: Tailwind CSS classes not being scanned
**Solution**: Ensure `content` path in `tailwind.config.ts` matches your file structure

```typescript
content: [
  './src/pages/**/*.{js,ts,jsx,tsx}',
  './src/components/**/*.{js,ts,jsx,tsx}',
],
```

### Issue 2: Dark Theme Elements Remaining
**Cause**: Old classes not fully replaced
**Solution**: Search for and replace:
- `bg-slate-900` → `bg-white`
- `text-slate-300` → `text-gray-600`
- `border-slate-800` → `border-gray-200`

### Issue 3: Focus Indicators Missing
**Cause**: Old CSS removing outlines
**Solution**: Remove any `outline: none` without replacement:

```css
/* Remove this: */
:focus {
  outline: none;
}

/* Replace with this: */
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Issue 4: API Mismatch
**Cause**: Component props don't match old API
**Solution**: Check component prop interfaces and update accordingly

See example in Step 6 above.

## 📊 Feature Comparison

| Feature | Old | New |
|---------|-----|-----|
| Theme | Dark | Light |
| Accessibility | Basic | WCAG 2.1 AA |
| Keyboard Nav | Partial | Full |
| Screen Reader | Limited | Comprehensive |
| Mobile Support | Basic | Responsive |
| Focus Indicators | No | Yes (2px ring) |
| Semantic HTML | Partial | Full |
| ARIA Labels | Few | Comprehensive |
| Touch Targets | 32px+ | 44px minimum |
| Color Contrast | Unknown | 4.5:1+ (AA) |

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] All pages rendering correctly
- [ ] No console errors or warnings
- [ ] Accessibility audit passing
- [ ] Performance metrics acceptable
- [ ] Mobile responsive working
- [ ] All forms functional
- [ ] Navigation working

### Deployment Steps
```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy (your deployment method)
# npm run deploy (or your CI/CD pipeline)
```

## 📞 Support

For migration issues:
1. Check this guide
2. Review WCAG Accessibility Guide
3. Check component documentation
4. Review console errors
5. Contact development team

## ✅ Completion Checklist

- [ ] All old components replaced
- [ ] Colors updated to light theme
- [ ] Accessibility features implemented
- [ ] Routes configured correctly
- [ ] Testing completed
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Ready for production

---

## 📚 Additional Resources

- [WCAG 2.1 Guide](./WCAG_ACCESSIBILITY_GUIDE.md)
- [Component Documentation](./README.md)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Migration Completed**: Check mark all items above ✅

**Date Started**: [Your Date]
**Date Completed**: [Your Date]
**Migrated By**: [Your Name]
