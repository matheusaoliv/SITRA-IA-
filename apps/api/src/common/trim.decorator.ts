import { Transform } from 'class-transformer';

// Runs before class-validator, so "   " fails @Length instead of being saved empty.
export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
