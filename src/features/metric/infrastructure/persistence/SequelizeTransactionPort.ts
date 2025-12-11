import sequelize from "@/config/db";
import { Transaction } from "sequelize";
import { TransactionPort } from "../../application/ports/TransactionPort";
import { PersistenceTransaction } from "../../application/ports/PersistenceTransaction";

export class SequelizeTransactionPort implements TransactionPort {
  async runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>
  ): Promise<T> {
    return sequelize.transaction(async (transaction: Transaction) => {
      return fn(transaction);
    });
  }
}
