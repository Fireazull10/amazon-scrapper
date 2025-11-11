// Amazon CSS Selectors for different page layouts

export const AmazonSelectors = {
    // Search result items
    searchResultItem: '[data-component-type="s-search-result"]',
    
    // Title selector
    title: {
      h2: 'h2',
      h2Span: 'h2 span',
      classes: [
        '.a-size-base-plus.a-color-base.a-text-normal',
        '.a-size-medium.a-color-base.a-text-normal',
        '.a-size-base.a-color-base',
        '.s-line-clamp-2',
        '.s-line-clamp-4',
        '.s-line-clamp-3',
        '[data-cy="title-recipe"]',
        '.a-link-normal .a-text-normal',
        'span.a-text-normal'
      ]
    },
    
    // Link selector
    link: {
      h2Link: 'h2 a',
      classes: [
        'a.a-link-normal',
        'a.s-underline-text',
        'a[href*="/dp/"]',
        'a.s-link-style'
      ],
      allLinks: 'a'
    },
    
    // Price selector
    price: {
      primary: '.a-price .a-offscreen'
    },
    
    // Rating selector
    rating: {
      primary: 'span[aria-label*="out of 5 stars"]',
      fallbacks: [
        'i.a-icon-star-small span.a-icon-alt',
        '.a-icon-star-small .a-icon-alt',
        '.a-icon-alt',
        '.a-star-small .a-icon-alt'
      ]
    },
    
    // reviews selector
    reviews: {
      primary: 'span[aria-label*="stars"]',
      fallbacks: [
        '.a-size-base.s-underline-text'
      ]
    },
    
    // Image selector
    image: {
      primary: 'img.s-image'
    }
  };
  
  // Product URL patterns to search for
  export const ProductUrlPatterns = ['/dp/', '/gp/product/', '/sspa/'];
  
  // Text filter
  export const TextFilters = {
    titleMinLength: 20,
    excludeKeywords: ['sponsored', '$']
  };
  