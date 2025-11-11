
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AmazonSelectors, ProductUrlPatterns, TextFilters } from './util/amazon.selectors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('search amazon for toys', async ({ page }) => {
  const searchTerm = "item";
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });
  
  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // create object with all the data we need to pass to the function
  const dataToPass = {
    selectors: AmazonSelectors,
    urlPatterns: ProductUrlPatterns,
    filters: TextFilters
  };

  const products = await page.$$eval(AmazonSelectors.searchResultItem, function(items, data) {
    // get the data we need
    const selectors = data.selectors;
    const urlPatterns = data.urlPatterns;
    const filters = data.filters;
    
    // helper function to make URLs work
    function normalizeUrl(href) {
      if (href && href.startsWith('http')) {
        return href;
      } else {
        return 'https://www.amazon.com' + href;
      }
    }
    
    // make a new array to store results
    const results = [];
    
    // loop through each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // get the ASIN
      const asin = item.getAttribute('data-asin') || '';
      
      // try to get the title
      let title = '';
      
      const h2Element = item.querySelector(selectors.title.h2);
      if (h2Element) {
        const span = h2Element.querySelector('span');
        if (span && span.textContent && span.textContent.trim()) {
          title = span.textContent.trim();
        } else {
          const h2Text = h2Element.innerText || h2Element.textContent;
          if (h2Text && h2Text.trim()) {
            title = h2Text.trim();
          }
        }
      }
      
      // try other ways to get title if we don't have it yet
      if (!title) {
        for (let j = 0; j < selectors.title.classes.length; j++) {
          const selector = selectors.title.classes[j];
          const el = item.querySelector(selector);
          if (el && el.textContent && el.textContent.trim()) {
            title = el.textContent.trim();
            break;
          }
        }
      }
      
      // last resort for title
      if (!title) {
        const anchors = item.querySelectorAll('a');
        for (let k = 0; k < anchors.length; k++) {
          const anchor = anchors[k];
          const text = anchor.textContent ? anchor.textContent.trim() : '';
          if (text && text.length > filters.titleMinLength) {
            // check if it has excluded keywords
            let hasExcludedKeyword = false;
            for (let m = 0; m < filters.excludeKeywords.length; m++) {
              if (text.includes(filters.excludeKeywords[m])) {
                hasExcludedKeyword = true;
                break;
              }
            }
            if (!hasExcludedKeyword) {
              title = text;
              break;
            }
          }
        }
      }

      // get the link
      let link = '';
      
      if (h2Element) {
        const anchor = h2Element.querySelector('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href) {
            link = normalizeUrl(href);
          }
        }
      }
      
      if (!link) {
        const allLinks = item.querySelectorAll(selectors.link.allLinks);
        for (let n = 0; n < allLinks.length; n++) {
          const a = allLinks[n];
          const href = a.getAttribute('href');
          if (href) {
            // check if it matches patterns
            let matchesPattern = false;
            for (let p = 0; p < urlPatterns.length; p++) {
              if (href.includes(urlPatterns[p])) {
                matchesPattern = true;
                break;
              }
            }
            if (matchesPattern) {
              link = normalizeUrl(href);
              break;
            }
          }
        }
      }
      
      if (!link) {
        for (let q = 0; q < selectors.link.classes.length; q++) {
          const selector = selectors.link.classes[q];
          const linkEl = item.querySelector(selector);
          if (linkEl) {
            const href = linkEl.getAttribute('href');
            if (href && href.length > 5) {
              link = normalizeUrl(href);
              break;
            }
          }
        }
      }
      
      // if we still don't have a link but have ASIN, make one
      if (!link && asin) {
        link = 'https://www.amazon.com/dp/' + asin;
      }

      // get price
      const priceElement = item.querySelector(selectors.price.primary);
      let price = 'N/A';
      if (priceElement && priceElement.textContent) {
        const priceText = priceElement.textContent.trim();
        if (priceText) {
          price = priceText;
        }
      }

      // get rating and reviews
      let rating = 'N/A';
      let reviews = 'N/A';
      
      const starElement = item.querySelector(selectors.rating.primary);
      if (starElement) {
        const ariaLabel = starElement.getAttribute('aria-label');
        if (ariaLabel) {
          reviews = ariaLabel;
          // try to get just the rating number
          const ratingMatch = ariaLabel.match(/(\d+\.?\d*)\s+out of 5 stars/);
          if (ratingMatch && ratingMatch[1]) {
            rating = ratingMatch[1] + ' out of 5 stars';
          }
        }
      }
      
      // try other selectors if we don't have rating
      if (rating === 'N/A') {
        for (let r = 0; r < selectors.rating.fallbacks.length; r++) {
          const selector = selectors.rating.fallbacks[r];
          const ratingEl = item.querySelector(selector);
          if (ratingEl) {
            const ratingText = ratingEl.textContent || ratingEl.getAttribute('aria-label');
            if (ratingText && ratingText.trim() && ratingText.includes('out of')) {
              rating = ratingText.trim();
              break;
            }
          }
        }
      }
      
      // get review count
      const reviewCountEl = item.querySelector(selectors.reviews.primary);
      if (reviewCountEl) {
        const ariaLabel = reviewCountEl.getAttribute('aria-label');
        if (ariaLabel) {
          const countMatch = ariaLabel.match(/(\d[\d,]*)\s*$/);
          if (countMatch && countMatch[1]) {
            reviews = countMatch[1] + ' reviews';
          } else {
            reviews = ariaLabel;
          }
        }
      }
      
      // try to get reviews from text if we still don't have it
      if (reviews === 'N/A') {
        for (let s = 0; s < selectors.reviews.fallbacks.length; s++) {
          const selector = selectors.reviews.fallbacks[s];
          const reviewTextEl = item.querySelector(selector);
          if (reviewTextEl && reviewTextEl.textContent) {
            const reviewText = reviewTextEl.textContent.trim();
            if (reviewText) {
              reviews = reviewText;
              break;
            }
          }
        }
      }

      // get image
      const imageElement = item.querySelector(selectors.image.primary);
      let image = '';
      if (imageElement) {
        const src = imageElement.getAttribute('src');
        if (src) {
          image = src;
        }
      }

      // create the product object
      const product = {
        asin: asin,
        title: title,
        price: price,
        rating: rating,
        reviews: reviews,
        image: image,
        link: link
      };
      
      // add it to results
      results.push(product);
    }
    
    // return all the products
    return results;
  }, dataToPass);

  const filename = `${searchTerm}_amazon.json`;
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(products, null, 2), 'utf-8');
  console.log(`Scraped ${products.length} products and saved to ${filename}`);
});
