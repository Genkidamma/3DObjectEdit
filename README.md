# 3D Model Configurator

A production-ready, SEO-optimized 3D model configurator with AI-powered material generation. Built with Angular, Three.js, and Gemini AI.

## Features

- 🎨 **3D Model Viewer**: Upload and view OBJ files with automatic centering and scaling
- 🤖 **AI Material Generation**: Generate PBR textures using natural language descriptions
- 🎛️ **Real-time Customization**: Adjust materials, lighting, and transformations in real-time
- 📱 **Mobile Responsive**: Fully responsive design with mobile-first approach
- ♿ **Accessible**: WCAG compliant with ARIA labels and keyboard navigation
- 🚀 **SEO Optimized**: Comprehensive meta tags, structured data, and sitemap
- 📦 **Export Options**: Export models as GLB or STL formats

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd copy-of-3d-obj-viewer1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create `.env.local` file
   - Add your Gemini API key: `API_KEY=your_api_key_here`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Production Build

### Build for Production

```bash
# Standard production build
npm run build:prod

# GitHub Pages optimized build
npm run build:github
```

The built files will be in the `dist/` directory.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- GitHub Pages deployment
- Netlify deployment
- Vercel deployment
- Custom static hosting

## Project Structure

```
├── src/
│   ├── app.component.ts          # Main app component with navigation
│   ├── configurator/             # 3D configurator component
│   ├── home/                     # Home page component
│   ├── about/                    # About page component
│   ├── faq/                      # FAQ page component
│   └── contact/                  # Contact page component
├── index.html                    # Main HTML with SEO meta tags
├── angular.json                  # Angular build configuration
├── package.json                  # Dependencies and scripts
├── robots.txt                    # Search engine crawler instructions
├── sitemap.xml                   # Site structure for search engines
└── manifest.json                 # PWA manifest
```

## SEO Features

- ✅ Comprehensive meta tags (title, description, keywords)
- ✅ Open Graph and Twitter Card support
- ✅ Structured data (JSON-LD) for WebApplication, Organization, and Breadcrumbs
- ✅ Canonical URLs
- ✅ Sitemap.xml for search engines
- ✅ Robots.txt configuration
- ✅ Mobile-friendly meta tags

## Accessibility Features

- ✅ ARIA labels and roles throughout
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader friendly
- ✅ Semantic HTML structure
- ✅ Skip to main content link
- ✅ WCAG AA color contrast compliance

## Technologies Used

- **Angular 20.3.0** - Frontend framework
- **Three.js 0.164.1** - 3D graphics library
- **Gemini AI** - AI-powered texture generation
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires WebGL support for 3D rendering.

## License

This project is private and proprietary.

## Support

For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)

For issues or questions, please check the FAQ page or contact support.

---

**Built with ❤️ using Angular and Three.js**
