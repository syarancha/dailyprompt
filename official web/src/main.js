const feedEl = document.getElementById('feed');
const cardTemplate = document.getElementById('card-template');

const GHOST_SITE_URL = 'https://arancha.ghost.io';
const GHOST_CONTENT_API_KEY = 'da4cfb6b7c8b17d8608333e481';
const GHOST_PAGE_LIMIT = 30;
const MOBILE_BREAKPOINT = 900;
const GHOST_IMAGE_WIDTH_DESKTOP = 640;
const GHOST_IMAGE_WIDTH_MOBILE = 640;

const COLUMN_BATCH_SIZE = 250;
const INITIAL_IMAGE_TARGET = 18;
const BACKGROUND_WARM_TARGET = 80;
const SCROLL_LOAD_THRESHOLD = 1200;
const MAX_TEXT_CARDS_PER_COLUMN = 5;
const TEXT_BASE_GAP_MIN = 10;
const TEXT_BASE_GAP_VAR = 8;
const ESTIMATED_TEXT_CARD_HEIGHT = 150;
const ESTIMATED_CARD_GAP = 22;
const DEFAULT_IMAGE_RATIO = 4 / 3;
const SOFT_FALLBACK_TIMEOUT_MS = 8000;

const SESSION_SEED = Math.floor(Math.random() * 1_000_000_000);

const state = {
  columnCount: 1,
  columnEls: [],
  columnWidth: 0,
  columnImageCounts: [],
  columnHeights: [],
  columnTextCounts: [],
  nextTextAt: [],
  featuredTextCards: [],
  loadedImageItems: [],
  seenItemKeys: new Set(),
  nextColumnPointer: 0,
  nextPage: 1,
  hasMore: true,
  isLoadingPage: false,
  loadingEl: null,
  renderedImages: 0,
  scrollTicking: false
};

function normalizeTitle(rawTitle) {
  return (rawTitle || 'Untitled post').replace(/^[^\w#가-힣]+/u, '').trim();
}

function buildPromptHoverTitle(rawTitle) {
  const text = rawTitle || '';
  const match = text.match(/#\s*(\d+)/);
  if (!match) return '오늘의 Midjourney Prompt';
  return `${match[1]}번째 오늘의 Midjourney Prompt`;
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeItemKey(item) {
  if (item.type === 'image' || item.type === 'video') {
    return `${item.type}:${item.src || ''}`;
  }
  return `${item.type}:${item.title || ''}:${item.href || ''}`;
}

function getFeedColumnCount() {
  const width = window.innerWidth;
  if (width <= 420) return 1;
  if (width <= 640) return 2;
  if (width <= 960) return 3;
  if (width <= 1100) return 4;
  return 5;
}

function isGifUrl(url) {
  return /\.gif(\?|$)/i.test(url);
}

function getGhostTargetWidth() {
  return window.innerWidth <= MOBILE_BREAKPOINT ? GHOST_IMAGE_WIDTH_MOBILE : GHOST_IMAGE_WIDTH_DESKTOP;
}

function optimizeGhostImageUrl(url) {
  if (!url || isGifUrl(url)) return url;
  const width = getGhostTargetWidth();

  try {
    const parsed = new URL(url, GHOST_SITE_URL);
    if (!parsed.pathname.includes('/content/images/')) return parsed.toString();
    if (parsed.pathname.includes('/content/images/size/')) return parsed.toString();

    parsed.pathname = parsed.pathname.replace('/content/images/', `/content/images/size/w${width}/`);
    return parsed.toString();
  } catch (_) {
    return url;
  }
}

function resolveMediaUrl(src, postUrl) {
  try {
    const resolved = new URL(src, postUrl || GHOST_SITE_URL).toString();
    return optimizeGhostImageUrl(resolved);
  } catch (_) {
    return src;
  }
}

function extractLastImageFromHtml(html) {
  if (!html) return null;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const captionNeedles = [
    '오늘의 Midjourney Prompt 입력 결과',
    '오늘의 Midjourney 프롬프트 입력 결과'
  ];

  const figures = Array.from(doc.querySelectorAll('figure'));
  const matchedImages = [];

  figures.forEach((figure) => {
    const caption = (figure.querySelector('figcaption')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!captionNeedles.some((needle) => caption.includes(needle))) return;

    const img = figure.querySelector('img[src]');
    if (!img) return;
    matchedImages.push(img);
  });

  if (!matchedImages.length) return null;

  const last = matchedImages[matchedImages.length - 1];
  const src = last.getAttribute('src') || '';
  if (!src) return null;

  const width = Number.parseInt(last.getAttribute('width') || '', 10);
  const height = Number.parseInt(last.getAttribute('height') || '', 10);
  const ratio = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? `${width} / ${height}`
    : null;

  return { src, ratio };
}

function showFeedLoading(message = '로딩중...') {
  if (!feedEl) return;

  if (!state.loadingEl) {
    const el = document.createElement('div');
    el.className = 'feed-loading';
    state.loadingEl = el;
  }

  state.loadingEl.textContent = message;
  if (!feedEl.contains(state.loadingEl)) {
    feedEl.appendChild(state.loadingEl);
  }
}

function hideFeedLoading() {
  if (state.loadingEl && state.loadingEl.parentNode) {
    state.loadingEl.parentNode.removeChild(state.loadingEl);
  }
}

function initColumns() {
  feedEl.innerHTML = '';
  state.columnCount = getFeedColumnCount();
  state.columnEls = [];
  state.columnWidth = 0;
  state.columnImageCounts = Array.from({ length: state.columnCount }, () => 0);
  state.columnHeights = Array.from({ length: state.columnCount }, () => 0);
  state.columnTextCounts = Array.from({ length: state.columnCount }, () => 0);
  state.nextTextAt = Array.from({ length: state.columnCount }, (_, idx) => {
    const offset = hashString(`seed:${SESSION_SEED}:col:${idx}`) % 6;
    return 7 + offset;
  });
  state.nextColumnPointer = 0;
  state.renderedImages = 0;
  state.seenItemKeys = new Set();

  for (let i = 0; i < state.columnCount; i += 1) {
    const col = document.createElement('div');
    col.className = 'feed-col';
    state.columnEls.push(col);
    feedEl.appendChild(col);
  }

  state.columnWidth = state.columnEls[0]?.clientWidth || 0;
}

function getCurrentColumnGap() {
  const firstCol = state.columnEls[0];
  if (!firstCol) return ESTIMATED_CARD_GAP;
  const styles = window.getComputedStyle(firstCol);
  const parsed = Number.parseFloat(styles.rowGap || styles.gap || '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : ESTIMATED_CARD_GAP;
}

function parseRatioValue(ratioString) {
  if (!ratioString || typeof ratioString !== 'string') return null;
  const parts = ratioString.split('/').map((value) => Number.parseFloat(value.trim()));
  if (parts.length !== 2) return null;
  const [w, h] = parts;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}

function estimateCardHeight(item, columnWidth = state.columnWidth) {
  const width = columnWidth || state.columnEls[0]?.clientWidth || 240;
  const gap = getCurrentColumnGap();

  if (item.type === 'text') {
    return ESTIMATED_TEXT_CARD_HEIGHT + gap;
  }

  const ratio = parseRatioValue(item.ratio) || DEFAULT_IMAGE_RATIO;
  const estimatedMediaHeight = width / ratio;
  return estimatedMediaHeight + gap;
}

function makeMedia(item) {
  if (item.type !== 'image') return null;

  const img = document.createElement('img');
  img.className = 'card-media';
  img.src = item.src;
  img.alt = item.title;
  img.loading = 'lazy';
  img.decoding = 'async';
  if (item.ratio) img.style.aspectRatio = item.ratio;

  return img;
}

function bindCardLink(node, item) {
  if (!item.href) return;

  node.classList.add('card-link');
  node.tabIndex = 0;
  node.setAttribute('role', 'link');
  node.setAttribute('aria-label', `${item.category || item.type}: ${item.title}`);

  const go = () => {
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('newsletter_click', {
        label: item.title,
        link_url: item.href,
        page_path: window.location.pathname
      });
    }
    window.location.href = item.href;
  };

  node.addEventListener('click', go);
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      go();
    }
  });
}

function createCardNode(item, columnIndex, indexInColumn) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);
  const mediaWrap = node.querySelector('.card-media-wrap');
  const titleEl = node.querySelector('.card-title');
  const typeEl = node.querySelector('.card-type');

  titleEl.textContent = item.title;
  typeEl.textContent = item.type === 'text' ? item.category : item.type;

  if (item.type === 'text') {
    node.classList.add('text-only');
    mediaWrap.remove();
  } else {
    node.classList.add('is-loading');
    const media = makeMedia(item);
    if (media) {
      mediaWrap.appendChild(media);

      const fallbackLabel = document.createElement('div');
      fallbackLabel.className = 'card-soft-fallback-label';
      fallbackLabel.textContent = 'Loading preview...';
      mediaWrap.appendChild(fallbackLabel);

      let settled = false;
      const setLoaded = () => {
        if (settled) return;
        settled = true;
        node.classList.remove('is-loading', 'is-soft-fallback');
        node.classList.add('is-loaded');
      };
      const setSoftFallback = () => {
        if (settled) return;
        node.classList.remove('is-loading');
        node.classList.add('is-soft-fallback');
      };

      const fallbackTimer = window.setTimeout(setSoftFallback, SOFT_FALLBACK_TIMEOUT_MS);
      media.addEventListener('load', () => {
        window.clearTimeout(fallbackTimer);
        setLoaded();
      }, { once: true });
      media.addEventListener('error', () => {
        window.clearTimeout(fallbackTimer);
        setSoftFallback();
      }, { once: true });

      // If browser cache resolves immediately, finalize in next frame.
      if (media.complete && media.naturalWidth > 0) {
        window.clearTimeout(fallbackTimer);
        setLoaded();
      }
    }
  }

  bindCardLink(node, item);
  node.classList.add('card-enter');
  node.style.setProperty('--enter-delay', `${((columnIndex + indexInColumn) % 7) * 20}ms`);

  requestAnimationFrame(() => node.classList.add('is-visible'));
  return node;
}

function pickColumnIndexForItem() {
  let fallback = -1;
  let minHeight = Number.POSITIVE_INFINITY;

  // Keep columns visually balanced: pick among the least-tall columns.
  for (let i = 0; i < state.columnCount; i += 1) {
    const count = state.columnImageCounts[i];
    if (count >= COLUMN_BATCH_SIZE) continue;
    const height = state.columnHeights[i];
    if (height < minHeight) {
      minHeight = height;
      fallback = i;
    }
  }

  if (fallback === -1) return -1;

  // Tie-break with rotating pointer so equal-height columns are used evenly.
  const candidates = [];
  for (let i = 0; i < state.columnCount; i += 1) {
    if (state.columnImageCounts[i] >= COLUMN_BATCH_SIZE) continue;
    if (Math.abs(state.columnHeights[i] - minHeight) <= 0.5) candidates.push(i);
  }
  if (!candidates.length) return fallback;

  const pointer = state.nextColumnPointer % candidates.length;
  const selected = candidates[pointer];
  state.nextColumnPointer += 1;
  return selected;
}

function appendTextCardIfNeeded(columnIndex) {
  if (!state.featuredTextCards.length) return;
  if (state.columnTextCounts[columnIndex] >= MAX_TEXT_CARDS_PER_COLUMN) return;

  const imageCount = state.columnImageCounts[columnIndex];
  const nextAt = state.nextTextAt[columnIndex];
  if (imageCount < nextAt) return;

  const textOrder = state.columnTextCounts[columnIndex];
  const textIdx = hashString(`text:${SESSION_SEED}:col:${columnIndex}:idx:${textOrder}`) % state.featuredTextCards.length;
  const textItem = state.featuredTextCards[textIdx];
  const node = createCardNode({ ...textItem }, columnIndex, state.columnEls[columnIndex].children.length);
  state.columnEls[columnIndex].appendChild(node);

  state.columnTextCounts[columnIndex] += 1;
  state.columnHeights[columnIndex] += estimateCardHeight(textItem);
  const gapOffset = hashString(`gap:${SESSION_SEED}:col:${columnIndex}:idx:${textOrder}`) % TEXT_BASE_GAP_VAR;
  state.nextTextAt[columnIndex] += TEXT_BASE_GAP_MIN + gapOffset;
}

function allColumnsFull() {
  return state.columnImageCounts.every((count) => count >= COLUMN_BATCH_SIZE);
}

function appendImageCard(item, options = {}) {
  const { recordLoaded = true } = options;
  const key = makeItemKey(item);
  if (!key || state.seenItemKeys.has(key)) return false;

  const columnIndex = pickColumnIndexForItem();
  if (columnIndex === -1) return false;

  const node = createCardNode(item, columnIndex, state.columnEls[columnIndex].children.length);
  state.columnEls[columnIndex].appendChild(node);

  if (recordLoaded) {
    state.loadedImageItems.push(item);
  }
  state.seenItemKeys.add(key);
  state.columnImageCounts[columnIndex] += 1;
  state.columnHeights[columnIndex] += estimateCardHeight(item);
  state.renderedImages += 1;

  appendTextCardIfNeeded(columnIndex);
  return true;
}

function rebuildFromLoadedItems() {
  const snapshot = [...state.loadedImageItems];
  initColumns();
  snapshot.forEach((item) => {
    appendImageCard(item, { recordLoaded: false });
  });
}

async function fetchFeaturedTextCards() {
  const apiUrl = new URL('/ghost/api/content/posts/', GHOST_SITE_URL);
  apiUrl.searchParams.set('key', GHOST_CONTENT_API_KEY);
  apiUrl.searchParams.set('filter', 'featured:true');
  apiUrl.searchParams.set('limit', '10');
  apiUrl.searchParams.set('order', 'published_at desc');
  apiUrl.searchParams.set('fields', 'title,url');

  const response = await fetch(apiUrl.toString());
  if (!response.ok) {
    throw new Error(`Ghost featured request failed (${response.status})`);
  }

  const data = await response.json();
  const posts = Array.isArray(data.posts) ? data.posts : [];

  return posts.map((post) => ({
    type: 'text',
    category: 'Daily Prompt',
    title: normalizeTitle(post.title),
    href: post.url || 'https://blog.secondbrush.co.kr/'
  }));
}

async function fetchGhostImagePage(page) {
  const apiUrl = new URL('/ghost/api/content/posts/', GHOST_SITE_URL);
  apiUrl.searchParams.set('key', GHOST_CONTENT_API_KEY);
  apiUrl.searchParams.set('limit', String(GHOST_PAGE_LIMIT));
  apiUrl.searchParams.set('page', String(page));
  apiUrl.searchParams.set('order', 'published_at desc');
  apiUrl.searchParams.set('fields', 'title,url,html');
  apiUrl.searchParams.set('formats', 'html');

  const response = await fetch(apiUrl.toString());
  if (!response.ok) {
    throw new Error(`Ghost API page request failed (${response.status})`);
  }

  const data = await response.json();
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const pagination = data.meta?.pagination;
  const hasNext = Boolean(pagination?.next);

  const cards = [];
  posts.forEach((post) => {
    const image = extractLastImageFromHtml(post.html || '');
    if (!image) return;

    cards.push({
      type: 'image',
      src: resolveMediaUrl(image.src, post.url),
      title: buildPromptHoverTitle(post.title),
      ratio: image.ratio,
      href: post.url || 'https://blog.secondbrush.co.kr/',
      category: 'Daily Prompt'
    });
  });

  return { cards, hasNext };
}

async function loadNextPage() {
  if (state.isLoadingPage || !state.hasMore) return;
  if (allColumnsFull()) {
    state.hasMore = false;
    return;
  }

  state.isLoadingPage = true;

  try {
    const { cards, hasNext } = await fetchGhostImagePage(state.nextPage);
    state.nextPage += 1;

    let appendedCount = 0;
    cards.forEach((card) => {
      if (allColumnsFull()) return;
      if (appendImageCard(card)) appendedCount += 1;
    });

    if (!hasNext || appendedCount === 0 || allColumnsFull()) {
      state.hasMore = !allColumnsFull() && hasNext && appendedCount > 0;
    }
  } catch (error) {
    console.error('Failed to load Ghost feed page:', error);
    state.hasMore = false;
  } finally {
    state.isLoadingPage = false;
  }
}

async function warmupInitialCards() {
  while (state.hasMore && state.renderedImages < INITIAL_IMAGE_TARGET && !allColumnsFull()) {
    // eslint-disable-next-line no-await-in-loop
    await loadNextPage();
  }
}

async function warmupInBackground(target) {
  while (state.hasMore && state.renderedImages < target && !allColumnsFull()) {
    // eslint-disable-next-line no-await-in-loop
    await loadNextPage();
    // Yield so UI remains responsive between network bursts.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function onScrollLoad() {
  if (state.scrollTicking) return;

  state.scrollTicking = true;
  requestAnimationFrame(async () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - SCROLL_LOAD_THRESHOLD;
    if (nearBottom && state.hasMore && !state.isLoadingPage) {
      showFeedLoading('로딩중... 더 불러오는 중입니다.');
      await loadNextPage();
      if (!state.isLoadingPage) hideFeedLoading();
    }
    state.scrollTicking = false;
  });
}

async function initFeed() {
  if (!feedEl || !cardTemplate) return;

  initColumns();
  showFeedLoading('로딩중... 이미지 준비 중입니다.');

  try {
    const featured = await fetchFeaturedTextCards();
    state.featuredTextCards = featured;
  } catch (error) {
    console.error('Skipping featured text cards because fetch failed:', error);
    state.featuredTextCards = [];
  }

  await warmupInitialCards();
  hideFeedLoading();

  window.addEventListener('scroll', onScrollLoad, { passive: true });
  window.addEventListener('resize', () => {
    const nextCount = getFeedColumnCount();
    if (nextCount === state.columnCount) return;
    rebuildFromLoadedItems();
  });

  // Keep fetching quietly after first paint to improve later scrolling.
  warmupInBackground(BACKGROUND_WARM_TARGET).catch((error) => {
    console.error('Background warmup failed:', error);
  });
}

initFeed();
