import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiClient, ApiClientError } from "../api-client";
import { server } from "../../test/mocks/server";
import { http, HttpResponse } from "msw";

describe("ApiClient", () => {
  const baseUrl = "http://localhost:8000/api";

  beforeEach(() => {
    // Clear any previous mock implementations
    vi.clearAllMocks();
  });

  describe("GET requests", () => {
    it("should make successful GET request", async () => {
      const mockData = { message: "Success", data: [1, 2, 3] };

      server.use(
        http.get(`${baseUrl}/test`, () => {
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiClient.get("/test");
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
    });

    it("should handle GET request with query parameters", async () => {
      server.use(
        http.get(`${baseUrl}/test`, ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get("page");
          const limit = url.searchParams.get("limit");

          return HttpResponse.json({
            page: parseInt(page || "1"),
            limit: parseInt(limit || "10"),
          });
        })
      );

      const result = await apiClient.get("/test", { page: "2", limit: "20" });

      expect(result.data).toEqual({ page: 2, limit: 20 });
    });
  });

  describe("POST requests", () => {
    it("should make successful POST request with JSON data", async () => {
      const requestData = { name: "Test", value: 123 };
      const responseData = { id: 1, ...requestData };

      server.use(
        http.post(`${baseUrl}/test`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(requestData);
          return HttpResponse.json(responseData, { status: 201 });
        })
      );

      const result = await apiClient.post("/test", requestData);
      expect(result.data).toEqual(responseData);
      expect(result.status).toBe(201);
    });

    it("should handle POST request with form data", async () => {
      const formData = new FormData();
      formData.append("name", "test file");
      formData.append("file", new File(["content"], "test.txt"));

      server.use(
        http.post(`${baseUrl}/upload`, async ({ request }) => {
          const body = await request.formData();
          const file = body.get("file") as File;
          const name = body.get("name") as string;
          return HttpResponse.json(
            {
              filename: file?.name,
              name: name,
            },
            { status: 201 }
          );
        })
      );

      const result = await apiClient.post("/upload", formData);
      expect(result.data).toEqual({
        filename: "test.txt",
        name: "test file",
      });
    });
  });

  describe("PUT requests", () => {
    it("should make successful PUT request", async () => {
      const updateData = { name: "Updated Name" };
      const responseData = { id: 1, ...updateData };

      server.use(
        http.put(`${baseUrl}/test/1`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(updateData);
          return HttpResponse.json(responseData);
        })
      );

      const result = await apiClient.put("/test/1", updateData);
      expect(result.data).toEqual(responseData);
    });
  });

  describe("DELETE requests", () => {
    it("should make successful DELETE request", async () => {
      server.use(
        http.delete(`${baseUrl}/test/1`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const result = await apiClient.delete("/test/1");
      expect(result.status).toBe(204);
    });
  });

  describe("Error handling", () => {
    it("should handle 400 Bad Request error", async () => {
      server.use(
        http.get(`${baseUrl}/error`, () => {
          return HttpResponse.json(
            { error: "Bad Request", message: "Invalid parameters" },
            { status: 400 }
          );
        })
      );

      await expect(apiClient.get("/error")).rejects.toThrow(ApiClientError);

      try {
        await apiClient.get("/error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(400);
        expect((error as ApiClientError).message).toContain(
          "Invalid parameters"
        );
      }
    });

    it("should handle 404 Not Found error", async () => {
      server.use(
        http.get(`${baseUrl}/notfound`, () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      await expect(apiClient.get("/notfound")).rejects.toThrow(ApiClientError);

      try {
        await apiClient.get("/notfound");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(404);
      }
    });

    it("should handle 500 Internal Server Error", async () => {
      server.use(
        http.get(`${baseUrl}/servererror`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error", message: "Something went wrong" },
            { status: 500 }
          );
        })
      );

      await expect(apiClient.get("/servererror")).rejects.toThrow(
        ApiClientError
      );

      try {
        await apiClient.get("/servererror");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(500);
      }
    });

    it("should handle network errors", async () => {
      server.use(
        http.get(`${baseUrl}/network-error`, () => {
          return HttpResponse.error();
        })
      );

      await expect(apiClient.get("/network-error")).rejects.toThrow();
    });
  });

  describe("Authentication", () => {
    it("should include authorization header when token is provided", async () => {
      const token = "test-token-123";

      server.use(
        http.get(`${baseUrl}/protected`, ({ request }) => {
          const authHeader = request.headers.get("Authorization");
          expect(authHeader).toBe(`Bearer ${token}`);
          return HttpResponse.json({ authenticated: true });
        })
      );

      // Test with token in options
      const result = await apiClient.get("/protected", undefined, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(result.data).toEqual({ authenticated: true });
    });
  });

  describe("Timeout handling", () => {
    it("should timeout requests that take too long", async () => {
      server.use(
        http.get(`${baseUrl}/slow`, () => {
          // Return a promise that never resolves to simulate a hanging request
          return new Promise(() => {});
        })
      );

      // Set a very short timeout for testing
      await expect(
        apiClient.get("/slow", undefined, { timeout: 100 })
      ).rejects.toThrow();
    }, 10000);
  });

  describe("File upload", () => {
    it("should upload files successfully", async () => {
      const file = new File(["file content"], "test.txt", {
        type: "text/plain",
      });

      server.use(
        http.post(`${baseUrl}/upload`, async ({ request }) => {
          const formData = await request.formData();
          const uploadedFile = formData.get("file") as File;

          return HttpResponse.json(
            {
              filename: uploadedFile.name,
              size: uploadedFile.size,
              type: uploadedFile.type,
            },
            { status: 201 }
          );
        })
      );

      const result = await apiClient.uploadFile("/upload", file);
      expect(result.data).toEqual({
        filename: "test.txt",
        size: file.size,
        type: "text/plain",
      });
      expect(result.status).toBe(201);
    });

    it("should upload files with additional fields", async () => {
      const file = new File(["content"], "test.txt");
      const additionalFields = {
        description: "Test file",
        category: "document",
      };

      server.use(
        http.post(`${baseUrl}/upload`, async ({ request }) => {
          const formData = await request.formData();
          const uploadedFile = formData.get("file") as File;

          return HttpResponse.json(
            {
              filename: uploadedFile?.name,
              description: formData.get("description"),
              category: formData.get("category"),
            },
            { status: 201 }
          );
        })
      );

      const result = await apiClient.uploadFile(
        "/upload",
        file,
        additionalFields
      );
      expect(result.data).toEqual({
        filename: "test.txt",
        description: "Test file",
        category: "document",
      });
    });
  });
});
