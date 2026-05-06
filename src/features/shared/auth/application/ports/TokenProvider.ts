export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

export interface TokenClaims {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface TokenProvider {
  sign(payload: TokenPayload): string;
  verify(token: string): Promise<TokenClaims>;
}
