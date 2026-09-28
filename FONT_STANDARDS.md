# SenpaiWorks Font Standardization Guide

## ✅ What Was Done

### 1. Removed Wallet Payment Option
- **File**: `checkout.html`
- **Action**: Removed the "Wallets" payment method card (Paytm, PhonePe, Mobikwik, etc.)
- **Status**: ✓ Complete

### 2. Added Global Font Variables
- **File**: `home.css` (main CSS file loaded on all pages)
- **Font Sizes Added**:
  ```css
  --font-xs: 0.75rem (12px)
  --font-sm: 0.875rem (14px)
  --font-base: 1rem (16px)
  --font-lg: 1.25rem (20px)
  --font-xl: 1.5rem (24px)
  --font-2xl: 2rem (32px)
  --font-3xl: 2.5rem (40px)
  --font-4xl: 3rem (48px)
  ```

- **Font Families**:
  ```css
  --font-family-base: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
  --font-family-brand: 'BankGothic Lt BT', sans-serif
  ```

- **Font Weights**:
  ```css
  --font-weight-light: 300
  --font-weight-normal: 400
  --font-weight-medium: 500
  --font-weight-semibold: 600
  --font-weight-bold: 700
  ```

## 📋 Audit Results

### Font Family Consistency: ✅ UNIFORM
- **Primary**: 'Plus Jakarta Sans' used across all content pages
- **Brand**: 'BankGothic Lt BT' used for logos and headers
- **Fallback**: Proper system font stack (Segoe UI, Roboto, etc.)

### Font Size Standardization: ⚠️ TO BE IMPLEMENTED
Small sections currently use inconsistent sizes:
- **drawer.css**: Multiple sizes (0.76rem, 0.82rem, 0.85rem, 0.86rem, 0.88rem)
- **community.css**: Multiple sizes (0.7rem, 0.85rem, 0.9rem, 0.95rem)

**Recommendation**: Update these to use:
- Small labels: `var(--font-xs)` (0.75rem)
- Regular small text: `var(--font-sm)` (0.875rem)

## 🎨 Usage Guidelines

### For Consistent Typography
1. **Headings**: Use `--font-2xl`, `--font-3xl`, `--font-4xl` with `--font-weight-bold`
2. **Body Text**: Use `--font-base` with `--font-weight-normal`
3. **Small Text/Labels**: Use `--font-sm` or `--font-xs`
4. **Emphasis**: Use `--font-weight-semibold` or `--font-weight-bold`

### Example CSS
```css
.section-title {
  font-family: var(--font-family-base);
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
}

.small-label {
  font-family: var(--font-family-base);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
}
```

## ✨ All Changes Applied

- ✓ Removed GitHub link from footer
- ✓ Removed GitHub card from community page  
- ✓ Removed Wallet payment option from checkout
- ✓ Added global font variables to home.css
- ✓ Established font standardization guidelines

## 🚀 Next Steps

To improve font consistency further:
1. Update drawer.css small text to use `var(--font-sm)`
2. Update community.css small text to use `var(--font-sm)` or `var(--font-xs)`
3. Audit all pages for hardcoded font-sizes and replace with variables
4. Test on mobile (480px), tablet (768px), and desktop (1024px+) breakpoints
