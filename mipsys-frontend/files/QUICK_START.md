# 🚀 Quick Start Guide - ServicePro Refactored Frontend

**Get up and running in 5 minutes!**

---

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 min)
```bash
cd refactored-frontend
npm install
```

### Step 2: Run Development Server (1 min)
```bash
npm run dev
```

### Step 3: Open in Browser (1 min)
Navigate to: **http://localhost:3000**

### Step 4: Explore Pages (2 min)
- **Dashboard**: http://localhost:3000
- **Inventory**: http://localhost:3000/inventory
- **Service Requests**: http://localhost:3000/service-requests

✅ **Done!** You're running the refactored ServicePro frontend.

---

## 📖 What You Get

### ✨ Fully Accessible Interface
- WCAG 2.1 Level AA compliant
- Screen reader support
- Full keyboard navigation
- Clear focus indicators

### 🎨 Modern Design
- Clean, light theme
- Professional appearance
- Responsive layout
- Mobile-friendly

### 📊 Complete Feature Set
- Dashboard with metrics
- Inventory management
- Service request tracking
- Purchase order system

### 📚 Comprehensive Docs
- Accessibility guide
- Migration guide
- Component documentation
- Setup instructions

---

## 🗂️ Key Files to Understand

### Start With These:
1. **README.md** - Project overview (5 min read)
2. **src/components/Layout.tsx** - Main structure (2 min read)
3. **src/components/Sidebar.tsx** - Navigation (3 min read)

### Learn More:
4. **WCAG_ACCESSIBILITY_GUIDE.md** - Accessibility details (15 min read)
5. **src/pages/DashboardPage.tsx** - Example page (10 min read)
6. **tailwind.config.ts** - Design tokens (5 min read)

---

## 🔍 Testing the Build

### Verify Installation
```bash
npm run type-check    # Check TypeScript
npm run lint          # Check code quality
```

### Run Tests
```bash
npm test              # Unit tests
npm run test:a11y     # Accessibility check
```

### Build for Production
```bash
npm run build
npm start
```

---

## 🎯 Key Pages

### Dashboard (`/`)
Real-time operational overview with:
- 4 key metrics cards
- Critical alerts
- System health status
- Technician workload
- Aging tickets

### Inventory (`/inventory`)
Spare parts management with:
- Critical stock alerts
- Parts directory
- Status indicators
- Purchase orders
- Stock levels

### Service Requests (`/service-requests`)
Ticket management with:
- Advanced filtering
- Status tracking
- Bulk actions
- Aging indicators
- Customer info

---

## 🔧 Common Tasks

### Add a New Page
```typescript
// Create: src/pages/NewPage.tsx
export const NewPage: React.FC = () => {
  return (
    <main id="main-content" role="main">
      <h1>Your Page Title</h1>
      {/* Content here */}
    </main>
  );
};
```

### Update Styles
Edit `src/styles/globals.css` or use Tailwind classes:
```typescript
<div className="bg-blue-600 text-white p-4 rounded-lg">
  Styled content
</div>
```

### Add Accessibility
Always include:
```typescript
<button
  aria-label="Clear description for screen readers"
  onClick={handleClick}
>
  Button Text
</button>
```

---

## ✅ Accessibility Checklist

When building new features, ensure:
- ✅ Semantic HTML (`<button>`, `<input>`, not `<div>`)
- ✅ ARIA labels for buttons without text
- ✅ Form labels associated with inputs
- ✅ Keyboard navigable (Tab works everywhere)
- ✅ Focus visible (blue ring appears)
- ✅ Color contrast (4.5:1 minimum)
- ✅ Tested with keyboard only
- ✅ Tested with screen reader

---

## 🎨 Design Tokens

### Colors (High Contrast)
```
Primary:   bg-blue-600       text-blue-600
Success:   bg-green-600      text-green-600
Error:     bg-red-600        text-red-600
Warning:   bg-orange-600     text-orange-600
Neutral:   bg-gray-100       text-gray-900
```

### Spacing (4px base)
```
sm: 8px    md: 16px    lg: 24px    xl: 32px
```

### Touch Targets
Minimum 44×44px (for mobile):
```typescript
className="min-h-[44px] min-w-[44px]"
```

---

## 🧪 Keyboard Navigation

Test these on every page:
| Key | Action |
|-----|--------|
| `Tab` | Move forward |
| `Shift+Tab` | Move backward |
| `Enter` | Activate button/link |
| `Space` | Toggle checkbox |
| `Arrow Keys` | Navigate in menus |

**Goal**: Should be able to use entire app with keyboard only!

---

## 🔌 API Integration

Current components use mock data. To connect real API:

```typescript
// In your page component
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/api/your-endpoint')
    .then(res => res.json())
    .then(setData)
    .catch(console.error);
}, []);

return <YourComponent items={data} />;
```

---

## 📱 Mobile Testing

Test on different devices:
```bash
# Open DevTools (F12)
# Click mobile icon (or Ctrl+Shift+M)
# Test responsive design
# Verify touch targets (44px minimum)
# Check orientation changes
```

---

## 🚀 Deploy to Production

### Prerequisites
- Node.js 18+
- npm or yarn
- Your hosting platform

### Build & Deploy
```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy (your platform specific)
# Example for Vercel:
vercel deploy --prod
```

---

## 🐛 Troubleshooting

### Page Shows Blank
1. Check console (F12 → Console tab)
2. Verify imports are correct
3. Check component exports
4. Rebuild: `npm run build`

### Styling Not Applied
1. Check Tailwind config paths
2. Restart dev server: `npm run dev`
3. Clear build cache: `rm -rf .next`
4. Reinstall: `npm install`

### Focus Ring Not Showing
Check that you have:
```css
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Keyboard Not Working
1. Make elements proper semantic HTML
2. Add proper event handlers
3. Test with browser dev tools
4. Check console for errors

---

## 📞 Getting Help

### Documentation
- **README.md** - Overview and setup
- **WCAG_ACCESSIBILITY_GUIDE.md** - Accessibility help
- **MIGRATION_GUIDE.md** - Migration help
- **Component JSDoc** - Code comments

### Tools
- **axe DevTools** - Find accessibility issues
- **Browser DevTools** - Inspect elements
- **TypeScript** - Check type errors

### Resources
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

## ✨ You're All Set!

You now have:
✅ Running development environment  
✅ Modern, accessible frontend  
✅ Full documentation  
✅ Production-ready code  

### Next:
1. Explore the pages
2. Read the documentation
3. Customize for your needs
4. Deploy to production
5. Gather user feedback

---

## 📊 Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run build          # Build for production
npm start              # Run production build

# Testing
npm test               # Run unit tests
npm run test:watch    # Watch mode
npm run test:a11y     # Accessibility audit

# Code Quality
npm run lint           # Check code quality
npm run format         # Format code
npm run type-check    # Check TypeScript

# Analysis
npm run analyze        # Analyze bundle size
```

---

## 🎯 Success Criteria

Your setup is successful when:
- ✅ Page loads at localhost:3000
- ✅ All pages accessible via navigation
- ✅ No console errors
- ✅ Tab navigation works
- ✅ Focus indicator visible (blue ring)
- ✅ Can use keyboard only
- ✅ `npm run test:a11y` passes

---

**Congratulations!** 🎉

Your ServicePro Operator Console is ready to go!

For detailed information, see **README.md** and **WCAG_ACCESSIBILITY_GUIDE.md**

---

*Quick Start Guide v1.0*  
*Last Updated: May 2026*
