# Chrome Web Store Submission Checklist

## Pre-Submission Requirements

### 1. Developer Account Setup
- [ ] Create Chrome Web Store Developer Account ($5 one-time fee)
- [ ] Verify identity (government-issued ID may be required)
- [ ] Complete developer profile

### 2. Extension Package
- [ ] Run `npm run build` for production build
- [ ] Test extension in fresh browser profile
- [ ] Verify all features work correctly
- [ ] Create ZIP file from `dist/` folder (do not include source files)

### 3. Store Assets
- [ ] Icon 128x128px (already in dist/icons/)
- [ ] Screenshots (1-5 images, 1280x800 or 640x400px)
- [ ] Promotional images (optional):
  - [ ] Small tile: 440x280px
  - [ ] Large tile: 920x680px
  - [ ] Marquee: 1400x560px

### 4. Listing Information
- [ ] Extension name: "Grade Entry Helper"
- [ ] Summary (under 132 characters)
- [ ] Detailed description
- [ ] Category: Productivity
- [ ] Language: English
- [ ] Website URL (GitHub repo or project site)
- [ ] Support email address

### 5. Legal Requirements
- [ ] Privacy policy (created in privacy-policy.md)
- [ ] Terms of service (if applicable)
- [ ] Permissions justification ready

### 6. Review Preparation
- [ ] Test on multiple screen sizes
- [ ] Verify accessibility compliance
- [ ] Check for policy violations
- [ ] Ensure no prohibited content

## Submission Steps

1. **Upload Extension**
   - Upload ZIP file from `dist/` folder
   - Chrome Web Store will auto-populate some manifest fields

2. **Complete Listing**
   - Add all store assets and descriptions
   - Set pricing (Free)
   - Configure distribution regions

3. **Submit for Review**
   - Review can take 1-7 days
   - Address any review feedback promptly

## Post-Submission

- [ ] Monitor review status
- [ ] Respond to reviewer feedback if needed
- [ ] Plan update/maintenance schedule
- [ ] Set up user support process

## Notes
- Single-purpose extensions are preferred by Chrome Web Store
- Clear permission justifications help review process
- High-quality screenshots improve conversion rates