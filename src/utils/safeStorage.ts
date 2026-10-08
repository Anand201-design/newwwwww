/**
 * Safe Storage utility for AI Studio preview iframe, sandboxed environments,
 * and private browsing modes.
 *
 * Prevents "DOMException: Access is denied for this document" when localStorage
 * or sessionStorage is restricted in cross-origin iframes.
 */

class SafeStorage implements Storage {
  private memory = new Map<string, string>();
  private type: "localStorage" | "sessionStorage";

  constructor(type: "localStorage" | "sessionStorage") {
    this.type = type;
  }

  private getNative(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      const storage = window[this.type];
      if (!storage) return null;
      // Probe to verify storage read/write permissions in iframe
      const probe = "__pc_probe__";
      storage.setItem(probe, "1");
      storage.removeItem(probe);
      return storage;
    } catch {
      return null;
    }
  }

  get length(): number {
    const native = this.getNative();
    if (native) {
      try {
        return native.length;
      } catch {
        // fall through
      }
    }
    return this.memory.size;
  }

  clear(): void {
    const native = this.getNative();
    if (native) {
      try {
        native.clear();
      } catch {
        // fall through
      }
    }
    this.memory.clear();
  }

  getItem(key: string): string | null {
    const native = this.getNative();
    if (native) {
      try {
        return native.getItem(key);
      } catch {
        // fall through
      }
    }
    return this.memory.has(key) ? (this.memory.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    const native = this.getNative();
    if (native) {
      try {
        return native.key(index);
      } catch {
        // fall through
      }
    }
    const keys = Array.from(this.memory.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    const native = this.getNative();
    if (native) {
      try {
        native.removeItem(key);
      } catch {
        // fall through
      }
    }
    this.memory.delete(key);
  }

  setItem(key: string, value: string): void {
    const native = this.getNative();
    if (native) {
      try {
        native.setItem(key, String(value));
      } catch {
        // fall through
      }
    }
    this.memory.set(key, String(value));
  }
}

export const safeLocalStorage = new SafeStorage("localStorage");
export const safeSessionStorage = new SafeStorage("sessionStorage");
