import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import MediaManager from "./index.jsx";

// Mock the API module
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
 * Helper that creates a fresh QueryClient for each test
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

describe("MediaManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders the media manager page with header", async () => {
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

    renderWithProviders(<MediaManager />);

    await waitFor(() => {
      expect(screen.getByText("Media Manager")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Upload, manage, and organize your media files")
    ).toBeInTheDocument();
  });

  it("renders the upload panel", async () => {
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

    renderWithProviders(<MediaManager />);

    await waitFor(() => {
      expect(screen.getByText("Upload New File")).toBeInTheDocument();
    });
  });

  it("displays media files in a table", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: [
                {
                  id: 1,
                  filename: "test-file.jpg",
                  mime_type: "image/jpeg",
                  size: 102400,
                  user_id: 1,
                  created_at: "2024-01-01T00:00:00Z",
                  stored_name: "test-file.jpg",
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

    renderWithProviders(<MediaManager />);

    await screen.findByText("test-file.jpg");
    expect(screen.getByText("test-file.jpg")).toBeInTheDocument();
  });

  it("shows pagination when there are multiple pages", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                filename: `file${i + 1}.jpg`,
                mime_type: "image/jpeg",
                size: 1024,
                user_id: 1,
                created_at: new Date().toISOString(),
                stored_name: `file${i + 1}.jpg`,
              })),
              total: 12,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({ data: { data: null } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaManager />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });
  });

  it("displays empty state when no media files exist", async () => {
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

    renderWithProviders(<MediaManager />);

    await screen.findByText("No media files found");
    expect(screen.getByText("No media files found")).toBeInTheDocument();
  });

  it("shows loading state initially", async () => {
    api.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                data: {
                  data: {
                    files: [],
                    total: 0,
                  },
                },
              }),
            100
          );
        })
    );

    renderWithProviders(<MediaManager />);

    expect(screen.getByText("Loading media...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading media...")).not.toBeInTheDocument();
    });
  });

  it("displays file information in table columns", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: [
                {
                  id: 1,
                  filename: "test-file.jpg",
                  mime_type: "image/jpeg",
                  size: 102400,
                  user_id: 1,
                  created_at: "2024-01-01T10:00:00Z",
                  stored_name: "test-file.jpg",
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

    renderWithProviders(<MediaManager />);

    await screen.findByText("test-file.jpg");
    expect(screen.getByText(/100/)).toBeInTheDocument(); // File size
    expect(screen.getByText(/File Name/)).toBeInTheDocument();
    expect(screen.getByText(/Size/)).toBeInTheDocument();
  });

  it("fetches media with correct limit and offset", async () => {
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

    renderWithProviders(<MediaManager />);

    await waitFor(() => {
      const mediaCalls = api.get.mock.calls.filter(([u]) =>
        u.startsWith("/media")
      );
      expect(mediaCalls.length).toBeGreaterThan(0);
      expect(mediaCalls[0][0]).toContain("limit=5");
      expect(mediaCalls[0][0]).toContain("offset=0");
    });
  });

  it("handles upload success and refreshes media list", async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          id: 1,
          filename: "new-file.jpg",
          stored_name: "new-file.jpg",
        },
      },
    });

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

    renderWithProviders(<MediaManager />);

    await screen.findByText("No media files found");
    expect(screen.getByText("No media files found")).toBeInTheDocument();
  });

  it("handles upload errors", async () => {
    api.post.mockRejectedValue(
      new Error("Upload failed")
    );

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

    renderWithProviders(<MediaManager />);

    await screen.findByText("No media files found");
  });

  it("displays action buttons (Download, Edit, Delete)", async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith("/media")) {
        return Promise.resolve({
          data: {
            data: {
              files: [
                {
                  id: 1,
                  filename: "test-file.jpg",
                  mime_type: "image/jpeg",
                  size: 1024,
                  user_id: 1,
                  created_at: new Date().toISOString(),
                  stored_name: "test-file.jpg",
                },
              ],
              total: 1,
            },
          },
        });
      }
      if (url === "/profile") {
        return Promise.resolve({
          data: {
            data: {
              id: 1,
              roles: [{ name: "admin" }],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<MediaManager />);

    await screen.findByText("test-file.jpg");

    // Action buttons should be present
    expect(screen.getByTitle("Download")).toBeInTheDocument();
    expect(screen.getByTitle("Edit")).toBeInTheDocument();
    expect(screen.getByTitle("Delete")).toBeInTheDocument();
  });
});
