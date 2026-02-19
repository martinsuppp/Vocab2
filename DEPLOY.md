# Deploying VocabMaster (SPA)

Since VocabMaster is now a Single Page Application (SPA), it can be deployed for free on static hosting platforms like Vercel, Netlify, or GitHub Pages.

## Deploying to Vercel (Recommended)
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the `frontend` directory.
3.  Follow the prompts.

## Deploying to Netlify
1.  Drag and drop the `frontend/dist` folder (after running `npm run build`) to Netlify Drop.

## Deploying to GitHub Pages
1.  Update `vite.config.js` to set `base` to your repository name if needed.
2.  Use `gh-pages` package to deploy `dist` folder.
