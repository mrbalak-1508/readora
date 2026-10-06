/**
 * In-memory LRU Page Cache and Preloader for 3D PDF Book Reader
 * Prevents memory overload on large books (200-500 pages) by only caching a small sliding window.
 */

export interface CachedPageData {
  pageNumber: number;
  viewportWidth: number;
  viewportHeight: number;
  aspectRatio: number;
  renderedAt: number;
}

const MAX_CACHED_PAGES = 8;

class PageCacheManager {
  private cache = new Map<number, CachedPageData>();
  private activeTasks = new Map<number, AbortController>();

  /**
   * Record page access and enforce LRU eviction
   */
  public touch(pageNumber: number, data: Omit<CachedPageData, "renderedAt">): void {
    if (this.cache.has(pageNumber)) {
      this.cache.delete(pageNumber);
    } else if (this.cache.size >= MAX_CACHED_PAGES) {
      // Evict oldest (first key in map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(pageNumber, {
      ...data,
      renderedAt: Date.now(),
    });
  }

  public get(pageNumber: number): CachedPageData | undefined {
    const item = this.cache.get(pageNumber);
    if (item) {
      // Move to back (most recently used)
      this.cache.delete(pageNumber);
      this.cache.set(pageNumber, item);
    }
    return item;
  }

  public has(pageNumber: number): boolean {
    return this.cache.has(pageNumber);
  }

  /**
   * Start a render task with cancellation tracking
   */
  public createAbortController(pageNumber: number): AbortController {
    // Cancel existing task for this page if any
    const existing = this.activeTasks.get(pageNumber);
    if (existing) {
      existing.abort();
    }
    const controller = new AbortController();
    this.activeTasks.set(pageNumber, controller);
    return controller;
  }

  public removeAbortController(pageNumber: number): void {
    this.activeTasks.delete(pageNumber);
  }

  /**
   * Cancel all tasks outside the active window
   */
  public pruneTasksOutsideWindow(activePages: number[], radius: number = 2): void {
    const allowed = new Set<number>();
    for (const page of activePages) {
      for (let offset = -radius; offset <= radius; offset++) {
        allowed.add(page + offset);
      }
    }

    for (const [page, controller] of this.activeTasks.entries()) {
      if (!allowed.has(page)) {
        controller.abort();
        this.activeTasks.delete(page);
      }
    }
  }

  public clear(): void {
    for (const controller of this.activeTasks.values()) {
      controller.abort();
    }
    this.activeTasks.clear();
    this.cache.clear();
  }
}

export const pageCache = new PageCacheManager();
