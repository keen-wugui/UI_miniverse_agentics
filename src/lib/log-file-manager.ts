import fs from 'fs';
import path from 'path';
import { createStream } from 'rotating-file-stream';
import type { Options as RotatingFileStreamOptions } from 'rotating-file-stream';
import type { FileLoggingConfig } from '@/config/logging-config';

export interface LogFileManagerOptions {
  config: FileLoggingConfig;
  enableRotation: boolean;
}

export class LogFileManager {
  private config: FileLoggingConfig;
  private enableRotation: boolean;
  private logStream: NodeJS.WritableStream | null = null;

  constructor(options: LogFileManagerOptions) {
    this.config = options.config;
    this.enableRotation = options.enableRotation;
  }

  // Initialize log directory and file stream
  async initialize(): Promise<NodeJS.WritableStream | null> {
    if (typeof window !== 'undefined') {
      // Browser environment - file logging not supported
      return null;
    }

    // Skip file logging during build or in serverless environments
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_FILE_LOGGING) {
      return null;
    }

    try {
      // Ensure log directory exists
      await this.ensureLogDirectory();

      if (this.enableRotation) {
        this.logStream = this.createRotatingStream();
      } else {
        this.logStream = this.createSimpleStream();
      }

      return this.logStream;
    } catch (error) {
      console.error('Failed to initialize log file manager:', error);
      return null;
    }
  }

  // Ensure log directory exists
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.config.logDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create log directory ${this.config.logDir}: ${error}`);
    }
  }

  // Create rotating file stream
  private createRotatingStream(): NodeJS.WritableStream {
    const rotatingOptions: RotatingFileStreamOptions = {
      size: this.config.maxSize,
      interval: '1d', // Daily rotation
      path: this.config.logDir,
      compress: this.config.compress ? 'gzip' : false,
      maxFiles: this.config.maxFiles,
    };

    // Generate filename with date pattern
    const generator = (time: number | Date, index?: number): string => {
      const dateObj = typeof time === 'number' ? new Date(time) : time;
      
      const dateStr = this.formatDate(dateObj, this.config.datePattern);
      let filename = this.config.filename.replace('%DATE%', dateStr);
      
      if (index !== undefined && index > 0) {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        filename = `${base}.${index}${ext}`;
      }
      
      return filename;
    };

    return createStream(generator, rotatingOptions);
  }

  // Create simple file stream (no rotation)
  private createSimpleStream(): NodeJS.WritableStream {
    const dateStr = this.formatDate(new Date(), this.config.datePattern);
    const filename = this.config.filename.replace('%DATE%', dateStr);
    const filePath = path.join(this.config.logDir, filename);
    
    return fs.createWriteStream(filePath, { flags: 'a' });
  }

  // Format date according to pattern
  private formatDate(date: Date, pattern: string): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      date = new Date(); // Fallback to current date
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return pattern
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  }

  // Cleanup old log files
  async cleanup(): Promise<void> {
    if (typeof window !== 'undefined') return;

    try {
      const files = await fs.promises.readdir(this.config.logDir);
      const logFiles = files.filter(file => 
        file.includes('app-') && (file.endsWith('.log') || file.endsWith('.log.gz'))
      );

      const cutoffDate = this.getCutoffDate(this.config.cleanupOlderThan);
      
      for (const file of logFiles) {
        const filePath = path.join(this.config.logDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.promises.unlink(filePath);
          console.log(`Cleaned up old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old log files:', error);
    }
  }

  // Parse cleanup period and return cutoff date
  private getCutoffDate(period: string): Date {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) {
      throw new Error(`Invalid cleanup period format: ${period}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const now = new Date();

    switch (unit) {
      case 'd': // days
        return new Date(now.getTime() - (value * 24 * 60 * 60 * 1000));
      case 'w': // weeks
        return new Date(now.getTime() - (value * 7 * 24 * 60 * 60 * 1000));
      case 'm': // months (approximate)
        return new Date(now.getTime() - (value * 30 * 24 * 60 * 60 * 1000));
      case 'y': // years (approximate)
        return new Date(now.getTime() - (value * 365 * 24 * 60 * 60 * 1000));
      default:
        throw new Error(`Unsupported cleanup period unit: ${unit}`);
    }
  }

  // Get log file stats
  async getLogStats(): Promise<{
    directory: string;
    totalFiles: number;
    totalSize: number;
    oldestFile?: string;
    newestFile?: string;
  }> {
    if (typeof window !== 'undefined') {
      return {
        directory: 'Browser environment',
        totalFiles: 0,
        totalSize: 0,
      };
    }

    try {
      const files = await fs.promises.readdir(this.config.logDir);
      const logFiles = files.filter(file => 
        file.includes('app-') && (file.endsWith('.log') || file.endsWith('.log.gz'))
      );

      let totalSize = 0;
      let oldestTime = Infinity;
      let newestTime = 0;
      let oldestFile = '';
      let newestFile = '';

      for (const file of logFiles) {
        const filePath = path.join(this.config.logDir, file);
        const stats = await fs.promises.stat(filePath);
        
        totalSize += stats.size;
        
        if (stats.mtime.getTime() < oldestTime) {
          oldestTime = stats.mtime.getTime();
          oldestFile = file;
        }
        
        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
          newestFile = file;
        }
      }

      return {
        directory: this.config.logDir,
        totalFiles: logFiles.length,
        totalSize,
        oldestFile: oldestFile || undefined,
        newestFile: newestFile || undefined,
      };
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        directory: this.config.logDir,
        totalFiles: 0,
        totalSize: 0,
      };
    }
  }

  // Close log stream
  async close(): Promise<void> {
    if (this.logStream && typeof this.logStream.end === 'function') {
      return new Promise((resolve) => {
        this.logStream!.end(() => {
          resolve();
        });
      });
    }
  }

  // Rotate logs manually
  async rotateLogs(): Promise<void> {
    if (this.enableRotation && this.logStream) {
      // For rotating-file-stream, rotation happens automatically
      // But we can trigger cleanup
      await this.cleanup();
    }
  }
}

// Utility functions for log management
export const logUtils = {
  // Convert size string to bytes
  parseSize: (sizeStr: string): number => {
    const match = sizeStr.match(/^(\d+)([KMGT]?)$/i);
    if (!match) return 0;
    
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'k': return value * 1024;
      case 'm': return value * 1024 * 1024;
      case 'g': return value * 1024 * 1024 * 1024;
      case 't': return value * 1024 * 1024 * 1024 * 1024;
      default: return value;
    }
  },

  // Format bytes to human readable
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Check disk space (Node.js only)
  checkDiskSpace: async (directory: string): Promise<{ free: number; total: number } | null> => {
    if (typeof window !== 'undefined') return null;
    
    try {
      const stats = await fs.promises.statfs(directory);
      return {
        free: stats.bavail * stats.bsize,
        total: stats.blocks * stats.bsize,
      };
    } catch (error) {
      console.error('Failed to check disk space:', error);
      return null;
    }
  },
};