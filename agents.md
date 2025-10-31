# 🧭 Agent Instructions: Client Module Documentation (TypeScript)

## Goal
All **public methods** in the `src/` folder **must include complete JSDoc/TSDoc comments** (`/** ... */`) following the **official TSDoc standard** and common TypeScript documentation conventions.

---

## 📚 Requirements

### 1. Add Documentation to All Public APIs
For every exported/public item in `client/` (functions, class methods, interfaces, types):
- Add a **JSDoc block** (`/** ... */`) immediately above the declaration.
- Document:
  - **What** it does and **when to use** it.
  - All **parameters** (`@param`) with types and meanings.
  - **Return value** (`@returns`).
  - **Errors/throws** (`@throws`) if applicable.
  - **Examples** (`@example`) that compile and run.
  - **Remarks** (`@remarks`) for extra context when useful.
  - **Visibility** (`@public`, `@internal`) where appropriate.

**Function example:**
```ts
/**
 * Sends a GET request to the specified endpoint.
 *
 * @param url - Absolute or relative URL to request.
 * @param init - Optional fetch init options (headers, credentials, etc.).
 * @returns Resolves with the parsed JSON response.
 * @throws {NetworkError} If the request fails or a non-2xx status is returned.
 *
 * @example
 * ```ts
 * const data = await getJson<{ users: string[] }>('/api/users');
 * console.log(data.users);
 * ```
 * @public
 */
export async function getJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
```

**Class method example:**
```ts
export class Client {
  /**
   * Retrieves a resource by ID.
   *
   * @param id - Unique identifier of the resource.
   * @returns The resource payload.
   * @throws {NotFoundError} If the resource does not exist.
   * @public
   */
  public async getById(id: string): Promise<Resource> {
    // ...
  }
}
```

---

### 2. Follow the Official TSDoc Standard
Agents **must** conform to the **TSDoc** spec and idioms used by the TypeScript ecosystem.
Key points:
- Prefer clear, concise, **imperative/third-person** descriptions (“Returns…”, “Retrieves…”).
- Use standard tags: `@param`, `@returns`, `@throws`, `@example`, `@remarks`, `@deprecated`, `@public`/`@internal`.
- Use Markdown inside blocks for lists, code fences, and links.
- Ensure examples are **valid TypeScript** that type-check.
- Keep tone **consistent** across files.

> References (for humans/agents): TSDoc (tsdoc.org), TypeDoc (typedoc.org), TypeScript Handbook docs comments.

---

### 3. Scope
Apply these rules to:
- All `.ts`/`.tsx` files under `src/`
- All **exported** functions and class methods
- Public classes, interfaces, types, enums, and constants

---

---

### ✅ Summary
**In short:**  
> Every **exported/public** item in `client/` must have a **complete JSDoc/TSDoc block**, using standard tags and runnable examples, and linted in CI so missing docs block merges.
