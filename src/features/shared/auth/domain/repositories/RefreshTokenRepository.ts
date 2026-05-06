import { RefreshToken } from "../entities/RefreshToken.js";

export type PersistenceTransaction = unknown;

export interface RefreshTokenRepository {
  save(token: RefreshToken, tx?: PersistenceTransaction): Promise<void>;
  findByTokenHashForUpdate(
    hash: string,
    tx: PersistenceTransaction,
  ): Promise<RefreshToken | null>;
  findByTokenHash(hash: string): Promise<RefreshToken | null>;
  revokeFamily(
    familyId: string,
    now?: Date,
    tx?: PersistenceTransaction,
  ): Promise<void>;
  findActiveByUser(userId: string): Promise<RefreshToken[]>;
}

export interface TransactionPort {
  runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>,
  ): Promise<T>;
}
