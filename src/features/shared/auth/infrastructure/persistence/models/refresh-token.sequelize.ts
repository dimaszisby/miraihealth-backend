import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import type { DbModels } from "@/infrastructure/db/types.js";

export interface RefreshTokenAttributes {
  id: string;
  userId: string;
  organizationId: string | null;
  familyId: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  "id" | "organizationId" | "revokedAt" | "replacedById" | "userAgent" | "ip"
>;

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare organizationId: string | null;
  declare familyId: string;
  declare tokenHash: string;
  declare issuedAt: Date;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
  declare replacedById: string | null;
  declare userAgent: string | null;
  declare ip: string | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize) {
    RefreshToken.init(
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
        organizationId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        familyId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        tokenHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        issuedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        revokedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        replacedById: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        userAgent: {
          type: DataTypes.STRING(512),
          allowNull: true,
        },
        ip: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "RefreshToken",
        tableName: "refresh_tokens",
        underscored: true,
        schema: "public",
      },
    );

    return RefreshToken;
  }

  static associate(models: DbModels) {
    RefreshToken.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });
  }
}

export function initRefreshToken(sequelize: Sequelize) {
  return RefreshToken.initModel(sequelize);
}

export function associateRefreshToken(models: DbModels) {
  RefreshToken.associate(models);
}
