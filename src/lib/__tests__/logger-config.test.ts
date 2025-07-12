import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiLogger, appLogger, extractErrorInfo } from '../logger-config';

// Mock pino to avoid actual logging during tests
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  })),
  stdSerializers: {
    req: vi.fn(),
    res: vi.fn(),
  },
}));

describe('Logger Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractErrorInfo', () => {
    it('should handle null/undefined errors', () => {
      expect(extractErrorInfo(null)).toBeNull();
      expect(extractErrorInfo(undefined)).toBeNull();
    });

    it('should extract standard Error properties', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      (error as any).code = 'TEST_CODE';
      (error as any).status = 500;

      const result = extractErrorInfo(error);

      expect(result).toMatchObject({
        message: 'Test error',
        name: 'TestError',
        code: 'TEST_CODE',
        status: 500,
      });
      expect(result?.stack).toBeDefined();
    });

    it('should handle custom error objects', () => {
      const customError = {
        message: 'Custom error',
        name: 'CustomError',
        statusText: 'Internal Server Error',
        data: { details: 'Additional info' },
      };

      const result = extractErrorInfo(customError);

      expect(result).toMatchObject({
        message: 'Custom error',
        name: 'CustomError',
        statusText: 'Internal Server Error',
        data: { details: 'Additional info' },
      });
    });

    it('should handle circular reference errors', () => {
      const circularError: any = new Error('Circular error');
      circularError.self = circularError; // Create circular reference

      const result = extractErrorInfo(circularError);

      expect(result).toBeDefined();
      expect(result?.message).toBe('Circular error');
      // Should not throw when serializing
    });

    it('should limit stack trace length', () => {
      const error = new Error('Long stack error');
      // Create a long stack trace
      error.stack = Array(20).fill('at SomeFunction').join('\n');

      const result = extractErrorInfo(error);

      if (result?.stack) {
        const stackLines = result.stack.split('\n');
        expect(stackLines.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('apiLogger', () => {
    it('should provide structured logging methods', () => {
      expect(typeof apiLogger.request).toBe('function');
      expect(typeof apiLogger.response).toBe('function');
      expect(typeof apiLogger.error).toBe('function');
      expect(typeof apiLogger.warn).toBe('function');
      expect(typeof apiLogger.debug).toBe('function');
    });
  });

  describe('appLogger', () => {
    it('should provide general logging methods', () => {
      expect(typeof appLogger.info).toBe('function');
      expect(typeof appLogger.warn).toBe('function');
      expect(typeof appLogger.error).toBe('function');
      expect(typeof appLogger.debug).toBe('function');
    });

    it('should handle string errors', () => {
      expect(() => {
        appLogger.error('String error message');
      }).not.toThrow();
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      expect(() => {
        appLogger.error(error);
      }).not.toThrow();
    });
  });
});

describe('Error Serialization Edge Cases', () => {
  it('should handle errors with non-enumerable properties', () => {
    const error = new Error('Test error');
    Object.defineProperty(error, 'hiddenProp', {
      value: 'hidden value',
      enumerable: false,
    });

    const result = extractErrorInfo(error);
    expect(result).toBeDefined();
    expect(result?.message).toBe('Test error');
  });

  it('should handle errors with getters that throw', () => {
    const error = new Error('Test error');
    Object.defineProperty(error, 'problematicGetter', {
      get() {
        throw new Error('Getter error');
      },
      enumerable: true,
    });

    // Should not throw when extracting error info
    expect(() => {
      extractErrorInfo(error);
    }).not.toThrow();
  });

  it('should handle completely malformed error objects', () => {
    const malformedError = {
      // Missing standard error properties
      randomProp: 'random value',
      toString: () => { throw new Error('toString throws'); },
    };

    const result = extractErrorInfo(malformedError);
    expect(result).toBeDefined();
    expect(result?.message).toBe('Unknown error'); // Fallback
  });
});