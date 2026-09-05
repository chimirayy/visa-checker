# Deployment checklist

## Required repository setting

GitHub repository → Settings → Pages → Build and deployment → Source → GitHub Actions

## Workflow versions

- checkout v5
- configure-pages v6
- upload-pages-artifact v5
- deploy-pages v5

## Expected workflow

1. Checkout repository
2. Configure GitHub Pages
3. Upload GitHub Pages artifact
4. Deploy to GitHub Pages

If `Configure GitHub Pages` returns a 404, Pages has not been enabled for the repository yet.
