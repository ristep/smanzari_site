# Refactoring Plan for Mappers

This document outlines the plan to simplify and improve the code in `internal/mappers/`.

## 1. Extract URL Generation Logic
**Current State:**
Media URLs and thumbnail paths are hardcoded within the `MediaRowToModel` function using string concatenation (e.g., `"/api/media/files/" + r.StoredName`).

**Improvement:**
Move this logic into dedicated helper functions or a separate service. This creates a single source of truth for URL structures and makes it easier to change storage strategies (e.g., switching to S3 or a CDN) in the future.

**Action:**
- [x] Create `GetMediaURL(storedName string) string`
- [x] Create `GetThumbnailURL(storedName string) string`
- [x] Use these helpers inside the mappers.

## 2. Split `mappers.go` File
**Current State:**
All mapper functions for Users, Media, and Albums are contained in a single `mappers.go` file. As the application grows, this file will become unmanageable.

**Improvement:**
Split the file into domain-specific files to improve navigation and readability.

**Action:**
- [x] `user_mappers.go`: `UserRowToModel` and related helpers.
- [x] `media_mappers.go`: `MediaRowToModel` and related helpers.
- [x] `album_mappers.go`: `AlbumRowToModel` and related helpers.
- [x] `helpers.go`: Generic helpers like `NullStringToString`.

## 3. Reduce Repetition in Struct Instantiation
**Current State:**
The `switch` statements contain highly repetitive code blocks where the same fields are assigned for different `sqlc` generated structs.

**Improvement:**
While `sqlc` generates distinct types preventing direct type unification, we can reduce visual clutter and potential bugs (updating one case but forgetting another) by using specific "constructor" helpers for the domain models if they share the exact same signature.

**Action:**
- [ ] Identify exact matches in field mapping.
- [ ] Evaluate creating internal helper functions (e.g., `mapBaseMediaFields(...)`) to populate common fields, though care must be taken not to create functions with excessive argument lists (parameter objects might be overkill here).

## 4. Standardize Null Handling
**Current State:**
Helper functions like `NullStringToString` exist but should be consistently applied across all mappers to ensure safety against nil pointers or invalid SQL null types.

**Action:**
- [x] Audit all assignments involving nullable fields (e.g., `Description`, `DeletedAt`).
- [x] Ensure `Null*` helpers are used exclusively instead of direct `.Valid` checks where possible to clean up the code.

## 5. Review `sqlc` Configuration
**Current State:**
`sqlc` is generating many unique structs for queries that are effectively identical.

**Improvement:**
Investigate `sqlc.yaml` configuration options such as `emit_result_struct_pointers` or referencing shared structs if possible, to reduce the number of unique types the mappers need to handle.
