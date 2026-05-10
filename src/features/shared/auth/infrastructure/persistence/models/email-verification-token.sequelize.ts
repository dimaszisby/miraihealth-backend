import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import type { DbModels } from "@/infrastructure/db/types.js";

export interface EmailVerificationTokenAttributes {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EmailVerificationTokenCreationAttributes = Optional<
  EmailVerificationTokenAttributes,
  "id" | "usedAt"
>;

export class EmailVerificationToken
  extends Model<
    EmailVerificationTokenAttributes,
    EmailVerificationTokenCreationAttributes
  >
  implements EmailVerificationTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize) {
    EmailVerificationToken.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        tokenHash: {
          type: DataTypes.CHAR(64),
          allowNull: false,
          unique: true,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "EmailVerificationToken",
        tableName: "email_verification_tokens",
        underscored: true,
        schema: "public",
      },
    );

    return EmailVerificationToken;
  }

  static associate(models: DbModels) {
    EmailVerificationToken.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });
  }
}

export function initEmailVerificationToken(sequelize: Sequelize) {
  return EmailVerificationToken.initModel(sequelize);
}

export function associateEmailVerificationToken(models: DbModels) {
  EmailVerificationToken.associate(models);
}
