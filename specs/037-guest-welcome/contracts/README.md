# Contracts: Guest Access & Welcome

**Feature**: 037-guest-welcome
**Date**: 2026-01-20

## Overview

This directory contains TypeScript interface contracts for the Guest Access & Welcome feature. Since this project follows a client-first architecture with Firebase (no REST API server), contracts are internal TypeScript interfaces rather than OpenAPI specifications.

## Files

### `hooks.ts`

Defines interfaces for:
- **GuestAccessState**: Discriminated union for access validation states
- **ExperienceCardData**: Minimal data needed for experience card display
- **UseGuestAccessReturn**: Return type for `useGuestAccess` hook
- **UseGuestRecordReturn**: Return type for `useGuestRecord` hook
- **Component Props**: Props interfaces for all guest domain components

## Usage

These contracts are reference documentation. The actual implementation will be in:
- `domains/guest/hooks/*.ts` - Hook implementations
- `domains/guest/components/*.tsx` - Component implementations
- `domains/guest/containers/*.tsx` - Container implementations

## Why Internal Contracts?

This project uses:
- **Firebase Client SDK** for data operations
- **TanStack Query** for client-side state management
- **No REST API server** (client-first architecture)

Therefore, traditional API contracts (OpenAPI, GraphQL schemas) don't apply. Instead, TypeScript interfaces define the contracts between:
- Hooks and components
- Components and containers
- Domain modules and routes

## Contract Enforcement

TypeScript strict mode ensures these contracts are followed:
- All hook return types must match their interfaces
- All component props must satisfy their interfaces
- Discriminated unions enable exhaustive pattern matching
