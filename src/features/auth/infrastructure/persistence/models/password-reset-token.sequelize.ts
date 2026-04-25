import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import type { DbModels } from "@/infrastructure/db/types.js";

export interface PasswordResetTokenAttributes {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PasswordResetTokenCreationAttributes = Optional<
  PasswordResetTokenAttributes,
  "id" | "usedAt"
>;

export class PasswordResetToken
  extends Model<
    PasswordResetTokenAttributes,
    PasswordResetTokenCreationAttributes
  >
  implements PasswordResetTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: Date | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize) {
    PasswordResetToken.init(
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
          type: DataTypes.STRING(64),
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
        modelName: "PasswordResetToken",
        tableName: "password_reset_tokens",
        underscored: true,
        schema: "public",
      },
    );

    return PasswordResetToken;
  }

  static associate(models: DbModels) {
    PasswordResetToken.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });
  }
}

export function initPasswordResetToken(sequelize: Sequelize) {
  return PasswordResetToken.initModel(sequelize);
}

export function associatePasswordResetToken(models: DbModels) {
  PasswordResetToken.associate(models);
}
