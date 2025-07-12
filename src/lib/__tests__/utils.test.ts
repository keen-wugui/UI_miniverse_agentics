import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("Utils", () => {
  describe("cn (className utility)", () => {
    it("should merge class names correctly", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "active", false && "inactive")).toBe("base active");
    });

    it("should handle arrays of classes", () => {
      expect(cn(["base", "active"], "extra")).toBe("base active extra");
    });

    it("should merge Tailwind conflicting classes", () => {
      // twMerge should handle conflicting Tailwind classes
      expect(cn("px-4", "px-6")).toBe("px-6");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("", undefined, null, false)).toBe("");
    });

    it("should handle complex class combinations", () => {
      const result = cn(
        "flex items-center",
        "px-4 py-2",
        "bg-blue-500 hover:bg-blue-600",
        "text-white",
        true && "rounded-md",
        false && "hidden"
      );
      
      expect(result).toContain("flex");
      expect(result).toContain("items-center");
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
      expect(result).toContain("bg-blue-500");
      expect(result).toContain("hover:bg-blue-600");
      expect(result).toContain("text-white");
      expect(result).toContain("rounded-md");
      expect(result).not.toContain("hidden");
    });
  });
});