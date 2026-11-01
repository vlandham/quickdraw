# Quick Draw visualizations and analysis

## About

Source code powering [https://vallandingham.me/quickdraw/](https://vallandingham.me/quickdraw/).## Running

Requires Node 18+. To set up locally:

```
npm install
npm run dev
```

Then open http://localhost:8000. This serves the repo root and rebuilds `build/app.js` and `build/app.css` from `src/` and `css/` on change.

To build for deployment:

```
npm run build
```

The site is served by GitHub Pages from the root of `master`, so commit the updated `build/` output.

**Note:**

`index.html` includes the Cloudflare Web Analytics beacon for vallandingham.me. It only loads on that hostname. Remove it if you fork this project.




## Analysis

Analysis is in `analysis/` sub-directory

I used `extract_times.ipynb` to prepare the data. `time_analysis.Rmd` to look at the data. And `bin_data.ipynb` to package the data up for display. 
