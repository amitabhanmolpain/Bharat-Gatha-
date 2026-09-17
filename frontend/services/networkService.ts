/**
 * Application Network & Connectivity Monitor for Bharat Gatha.
 *
 * Provides non-blocking network state detection without interfering with UI rendering.
 */

type NetworkListener = (isOnline: boolean) => void;

class NetworkService {
  private listeners: Set<NetworkListener> = new Set();
  private onlineStatus: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleStatusChange(true));
      window.addEventListener("offline", () => this.handleStatusChange(false));
    }
  }

  private handleStatusChange(status: boolean) {
    this.onlineStatus = status;
    this.listeners.forEach((l) => l(status));
  }

  public isOnline(): boolean {
    if (typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return this.onlineStatus;
  }

  public isOffline(): boolean {
    return !this.isOnline();
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Optional non-blocking API probe to verify backend availability.
   * Never blocks UI rendering or game loops.
   */
  public async checkApiAvailability(backendUrl?: string): Promise<boolean> {
    if (this.isOffline()) return false;
    const url = backendUrl || "http://localhost:5001";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/api/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const networkService = new NetworkService();
