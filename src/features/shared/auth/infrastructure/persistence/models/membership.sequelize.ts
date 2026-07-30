import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import type { DbModels } from "@/infrastructure/db/types.js";

export interface MembershipAttributes {
  id: string;
  userId: string;
  organizationId: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited" | "removed";
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MembershipCreationAttributes = Optional<MembershipAttributes, "id">;

export class Membership
  extends Model<MembershipAttributes, MembershipCreationAttributes>
  implements MembershipAttributes
{
  declare id: string;
  declare userId: string;
  declare organizationId: string;
  declare role: "owner" | "admin" | "member";
  declare status: "active" | "invited" | "removed";
  declare joinedAt: Date;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static initModel(sequelize: Sequelize) {
    Membership.init(
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
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            isIn: [["owner", "admin", "member"]],
          },
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: "active",
          validate: {
            isIn: [["active", "invited", "removed"]],
          },
        },
        joinedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "Membership",
        tableName: "memberships",
        underscored: true,
        schema: "public",
      },
    );

    return Membership;
  }

  static associate(models: DbModels) {
    Membership.belongsTo(models.User, {
      as: "user",
      foreignKey: { name: "userId", field: "user_id", allowNull: false },
      onDelete: "CASCADE",
    });

    Membership.belongsTo(models.Organization, {
      as: "organization",
      foreignKey: {
        name: "organizationId",
        field: "organization_id",
        allowNull: false,
      },
      onDelete: "CASCADE",
    });
  }
}

export function initMembership(sequelize: Sequelize) {
  return Membership.initModel(sequelize);
}

export function associateMembership(models: DbModels) {
  Membership.associate(models);
}
