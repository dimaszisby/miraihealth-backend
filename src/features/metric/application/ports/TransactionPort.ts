import { PersistenceTransaction } from "./PersistenceTransaction";

export interface TransactionPort {
  runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>
  ): Promise<T>;
}
