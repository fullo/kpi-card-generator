import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000/api/v1');

// Mock window.URL.createObjectURL and revokeObjectURL for file download tests
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.alert and confirm for dialog tests
global.alert = vi.fn();
global.confirm = vi.fn(() => true);

// Mock intersection observer for any components that might use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
}));