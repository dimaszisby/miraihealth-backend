import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    /** Raw, unmodified request pieces (for debugging/observability) */
    raw?: {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };
    /**
     * Canonical, validated, and normalized payload produced by your
     * validate() middleware. Type is filled at use sites via z.infer<Schema>.
     */
    validated?: unknown;
  }
}
