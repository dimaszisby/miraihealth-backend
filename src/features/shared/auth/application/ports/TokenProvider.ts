export interface TokenPayload {
  id: string;
  email: string;
  username: string;
  organizationId: string;
}

export interface TokenClaims {
  userId: string;
  email: string;
  organizationId: string | null;
  iat: number;
  exp: number;
}

export interface TokenProvider {
  sign(payload: TokenPayload): string;
  verify(token: string): Promise<TokenClaims>;
}
