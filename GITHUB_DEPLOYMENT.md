# GitHub Pages Deployment Guide

## Quick Setup Steps

### 1. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Connect to Your GitHub Repository

**Option A: If you already have a GitHub repository:**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Option B: If you need to create a new repository:**

1. Go to GitHub and create a new repository
2. Copy the repository URL
3. Run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 3. Deploy to GitHub Pages

Once your repository is set up, simply run:

```bash
npm run deploy:gh
```

This will:
- Build your app for production
- Deploy it to the `gh-pages` branch
- Make it available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **gh-pages** branch
5. Select **/ (root)** folder
6. Click **Save**

Your site will be live in a few minutes!

## Important: Update URLs

Before deploying, update these files with your actual GitHub Pages URL:

1. **index.html** - Replace `yourusername.github.io/repository-name` with your actual URL
2. **sitemap.xml** - Update all URLs
3. **robots.txt** - Update sitemap URL

## Troubleshooting

### If deployment fails:
- Make sure you're logged into GitHub: `git config --global user.name "Your Name"`
- Make sure you have push access to the repository
- Check that the repository exists and is accessible

### If the site shows a blank page:
- Check browser console for errors
- Verify the build completed successfully
- Make sure GitHub Pages is enabled in repository settings
- Wait a few minutes for GitHub to process the deployment

## Manual Deployment (Alternative)

If `npm run deploy:gh` doesn't work, you can deploy manually:

```bash
# Build the project
npm run build:github

# Create gh-pages branch
git checkout --orphan gh-pages
git rm -rf .

# Copy dist contents
cp -r dist/* .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force

# Return to main branch
git checkout main
```

