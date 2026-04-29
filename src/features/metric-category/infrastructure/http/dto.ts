// Compatibility shim — keeps relative imports from locked dirs (src/types/) resolving
// after metric-category was moved to src/features/public/metric-category/.
export * from "@/features/public/metric-category/infrastructure/http/dto.js";
