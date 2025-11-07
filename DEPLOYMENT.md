# Deployment Guide for 3D Model Configurator

This guide will help you deploy your 3D Model Configurator to GitHub Pages or any static hosting service.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Git repository set up
- GitHub account (for GitHub Pages deployment)

## Pre-Deployment Checklist

### 1. Update Domain URLs

Before building for production, update the following files with your actual domain:

#### `index.html`
- Update all instances of `https://yourusername.github.io/repository-name/` with your actual URL
- Update canonical URLs
- Update Open Graph and Twitter Card URLs
- Update structured data (JSON-LD) URLs

#### `sitemap.xml`
- Update all `<loc>` tags with your actual domain
- Update lastmod dates if needed

#### `robots.txt`
- Update the Sitemap URL

### 2. Environment Variables

If you're using the Gemini API, ensure your API key is properly configured:
- For local development: Set in `.env.local` file
- For production: Configure in your hosting platform's environment variables (if using server-side rendering)
- **Note**: For client-side only apps, API keys should be handled securely. Consider using a backend proxy for production.

### 3. Generate Required Assets

Create the following assets if they don't exist:

- `favicon.ico` - Main favicon
- `icons/icon-192.png` - PWA icon (192x192)
- `icons/icon-512.png` - PWA icon (512x512)
- `icons/apple-touch-icon.png` - Apple touch icon (180x180)
- `icons/favicon-32x32.png` - 32x32 favicon
- `icons/favicon-16x16.png` - 16x16 favicon
- `og-image.png` - Open Graph image (1200x630 recommended)

## Building for Production

### Option 1: Standard Production Build

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build:prod

# The output will be in the `dist/` directory
```

### Option 2: GitHub Pages Build

```bash
# Build optimized for GitHub Pages (uses relative paths)
npm run build:github

# The output will be in the `dist/` directory
```

## Deployment Methods

### Method 1: GitHub Pages (Recommended)

#### Step 1: Build the Project

```bash
npm run build:github
```

#### Step 2: Deploy to GitHub Pages

**Option A: Using gh-pages branch**

1. Install gh-pages (if not already installed):
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy:gh": "npm run build:github && gh-pages -d dist"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy:gh
   ```

**Option B: Manual Deployment**

1. Build the project:
   ```bash
   npm run build:github
   ```

2. Copy all contents from the `dist/` directory

3. Create or checkout the `gh-pages` branch:
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   ```

4. Paste the contents from `dist/` into the repository root

5. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   ```

6. In GitHub repository settings:
   - Go to Settings → Pages
   - Select `gh-pages` branch as source
   - Save

**Option C: Using GitHub Actions (Automated)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build:github
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Method 2: Netlify

1. Build the project:
   ```bash
   npm run build:prod
   ```

2. Drag and drop the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop)

   OR

3. Connect your GitHub repository:
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
   - Base directory: (leave empty)

### Method 3: Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Build and deploy:
   ```bash
   npm run build:prod
   vercel --prod
   ```

   OR

3. Connect GitHub repository in Vercel dashboard:
   - Framework Preset: Angular
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`

### Method 4: Any Static Hosting

1. Build the project:
   ```bash
   npm run build:prod
   ```

2. Upload all contents from the `dist/` directory to your hosting provider's root directory

3. Ensure your server is configured to:
   - Serve `index.html` for all routes (for Angular routing)
   - Support relative paths
   - Enable gzip compression
   - Set proper cache headers

## Post-Deployment

### 1. Verify Deployment

- Visit your deployed site
- Test all routes (Home, Configurator, About, FAQ, Contact)
- Test file upload functionality
- Verify 3D model loading
- Check mobile responsiveness

### 2. Submit to Search Engines

#### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property
3. Verify ownership
4. Submit your sitemap: `https://yourdomain.com/sitemap.xml`

#### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Submit your sitemap

### 3. Test SEO

- Use [Google Rich Results Test](https://search.google.com/test/rich-results) to verify structured data
- Use [PageSpeed Insights](https://pagespeed.web.dev/) to check performance
- Use [Lighthouse](https://developers.google.com/web/tools/lighthouse) for accessibility and SEO audit

### 4. Monitor Performance

- Set up Google Analytics (uncomment in `index.html`)
- Monitor Core Web Vitals
- Check error logs
- Monitor API usage (if using Gemini API)

## Troubleshooting

### Issue: Routes return 404

**Solution**: Ensure your hosting provider is configured to serve `index.html` for all routes. For GitHub Pages, this is handled automatically with hash routing.

### Issue: Assets not loading

**Solution**: 
- Verify all paths use relative paths (`./` instead of `/`)
- Check that `baseHref` is set to `./` in `angular.json`
- Ensure all assets are in the `dist/` directory

### Issue: 3D models not loading

**Solution**:
- Check browser console for CORS errors
- Verify WebGL support in the browser
- Check that Three.js CDN links are accessible

### Issue: API errors

**Solution**:
- Verify API keys are correctly configured
- Check CORS settings if using external APIs
- Review browser console for specific error messages

## Performance Optimization

### Already Implemented
- ✅ Code minification
- ✅ Asset optimization
- ✅ Lazy loading (via Angular)
- ✅ CDN for dependencies
- ✅ Optimized build configuration

### Additional Recommendations
- Enable gzip/brotli compression on your server
- Set up CDN for static assets
- Implement service worker for offline support (PWA)
- Use image optimization for any custom images
- Monitor bundle size and split large chunks if needed

## Security Considerations

1. **API Keys**: Never commit API keys to version control. Use environment variables or a backend proxy.

2. **Content Security Policy**: Consider adding CSP headers to prevent XSS attacks.

3. **HTTPS**: Always use HTTPS in production.

4. **File Upload**: The current implementation only accepts `.obj` files. Consider adding server-side validation if you add file upload to a backend.

## Support

For issues or questions:
- Check the FAQ page on your deployed site
- Review browser console for errors
- Check GitHub issues (if applicable)

---

**Last Updated**: December 2024
**Angular Version**: 20.3.0
**Three.js Version**: 0.164.1

