/**
 * Muhkam — Contact Form Validation Tests
 */
import { describe, it, expect } from 'vitest';
import { validateContactForm } from '../server/middleware/validator.js';

describe('Contact Form Validation', () => {
  // Valid submissions
  it('accepts valid complete form', () => {
    const result = validateContactForm({
      name: 'Ahmed',
      email: 'ahmed@example.com',
      company: 'Muhkam',
      message: 'Hello, I need a website built for my company.',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts form without company (optional)', () => {
    const result = validateContactForm({
      name: 'Ahmed',
      email: 'ahmed@example.com',
      company: '',
      message: 'Hello, I need a website built.',
    });
    expect(result.valid).toBe(true);
  });

  // Name validation
  it('rejects empty name', () => {
    const result = validateContactForm({ name: '', email: 'a@b.com', message: 'Hello world test' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'name')).toBe(true);
  });

  it('rejects name too short', () => {
    const result = validateContactForm({ name: 'A', email: 'a@b.com', message: 'Hello world test' });
    expect(result.valid).toBe(false);
  });

  it('rejects name too long', () => {
    const result = validateContactForm({ name: 'A'.repeat(101), email: 'a@b.com', message: 'Hello world test' });
    expect(result.valid).toBe(false);
  });

  // Email validation
  it('rejects invalid email', () => {
    const result = validateContactForm({ name: 'Ahmed', email: 'not-an-email', message: 'Hello world test' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'email')).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateContactForm({ name: 'Ahmed', email: '', message: 'Hello world test' });
    expect(result.valid).toBe(false);
  });

  // Message validation
  it('rejects short message', () => {
    const result = validateContactForm({ name: 'Ahmed', email: 'a@b.com', message: 'Hi' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'message')).toBe(true);
  });

  it('rejects message too long', () => {
    const result = validateContactForm({ name: 'Ahmed', email: 'a@b.com', message: 'A'.repeat(5001) });
    expect(result.valid).toBe(false);
  });

  // XSS prevention
  it('sanitizes HTML in name', () => {
    const result = validateContactForm({
      name: '<script>alert("xss")</script>Ahmed',
      email: 'a@b.com',
      message: 'Normal message here',
    });
    expect(result.sanitized.name).toContain('&lt;script&gt;');
  });

  // Null/undefined body
  it('rejects null body', () => {
    const result = validateContactForm(null);
    expect(result.valid).toBe(false);
  });

  it('rejects undefined body', () => {
    const result = validateContactForm(undefined);
    expect(result.valid).toBe(false);
  });
});
