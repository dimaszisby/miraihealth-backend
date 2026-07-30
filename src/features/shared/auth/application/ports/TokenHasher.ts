export interface TokenHasher {
  generate(): string;
  hash(raw: string): string;
}
