export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

export interface TokenProvider {
  sign(payload: TokenPayload): string;
}
