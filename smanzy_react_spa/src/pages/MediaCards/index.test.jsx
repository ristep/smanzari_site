import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import MediaCards from "./index.jsx";

// Mock the API module used in the component
vi.mock("@/services/api", () => {
  return {
    __esModule: true,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import api from "@/services/api";

/**
 * Helper that creates a fresh QueryClient for each test so tests are isolated.
 */
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithProviders(ui, { route = "/" } = {}) {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MediaCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("shows pagination when server reports multiple pages", async () => {
    // 20 total items, default limit = 8 -> 3 pages
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: Array.from({ length: 8 }, (_, i) => ({
                id: i + 1,
                filename: `file${i + 1}.jpg`,
                mime_type: "image/jpeg",
                size: 1024,
                user_id: 1,
                created_at: new Date().toISOString(),
                stored_name: `stored${i + 1}.jpg`,
              })),
              total: 20,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaCards />);

    // Pagination should show "Page 1 of 3"
    await screen.findByText(/Page\s+1\s+of\s+3/);
    expect(screen.getByText(/Page\s+1\s+of\s+3/)).toBeInTheDocument();
  });

  it("hides pagination when there's only a single page", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: Array.from({ length: 3 }, (_, i) => ({
                id: i + 1,
                filename: `file${i + 1}.jpg`,
                mime_type: "image/jpeg",
                size: 1024,
                user_id: 1,
                created_at: new Date().toISOString(),
                stored_name: `stored${i + 1}.jpg`,
              })),
              total: 3,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaCards />);

    // Wait for queries to settle, then pagination shouldn't be present
    await waitFor(() => {
      expect(screen.queryByText(/Page\s+\d+\s+of\s+\d+/)).toBeNull();
    });
  });

  it("clamps a too-large page param down to the last page", async () => {
    // Simulate starting at /?page=10 and server returns total=10 (limit 8 => 2 pages)
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: Array.from({ length: 8 }, (_, i) => ({
                id: i + 1,
                filename: `file${i + 1}.jpg`,
                mime_type: "image/jpeg",
                size: 1024,
                user_id: 1,
                created_at: new Date().toISOString(),
                stored_name: `stored${i + 1}.jpg`,
              })),
              total: 10,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaCards />, { route: "/?page=10" });

    // After data arrival and clamping, page should be clamped to "2 of 2"
    await screen.findByText(/Page\s+2\s+of\s+2/);
    expect(screen.getByText(/Page\s+2\s+of\s+2/)).toBeInTheDocument();
  });

  it("includes limit in the /media request", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: Array.from({ length: 2 }, (_, i) => ({
                id: i + 1,
                filename: `file${i + 1}.jpg`,
                mime_type: "image/jpeg",
                size: 1024,
                user_id: 1,
                created_at: new Date().toISOString(),
                stored_name: `stored${i + 1}.jpg`,
              })),
              total: 10,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaCards />);

    await waitFor(() => {
      // find the first /media call that contains 'limit='
      const mediaCalls = api.get.mock.calls.filter(([u]) =>
        u.startsWith("/media"),
      );
      expect(mediaCalls.length).toBeGreaterThan(0);
      expect(mediaCalls[0][0]).toContain("limit=8");
    });
  });

  it("renders media cards when data is loaded", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: [
                {
                  id: 1,
                  filename: "test-image.jpg",
                  mime_type: "image/jpeg",
                  size: 1024,
                  user_id: 1,
                  created_at: new Date().toISOString(),
                  stored_name: "test-image.jpg",
                },
              ],
              total: 1,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaCards />);

    // Wait for the media file to appear
    await screen.findByText("test-image.jpg");
    expect(screen.getByText("test-image.jpg")).toBeInTheDocument();
  });

  it("shows empty state when no media files exist", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: [],
              total: 0,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaCards />);

    // Wait for empty state text
    await screen.findByText("No media files found");
    expect(screen.getByText("No media files found")).toBeInTheDocument();
  });
});
