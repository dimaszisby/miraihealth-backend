import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import type { DbModels } from "@/infrastructure/db/types.js";

export interface OrganizationInviteAttributes {
  id: string;
  organizationId: string;
  email: string;
  role: "admin" | "member";
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt?: Date;
}

export type OrganizationInviteCreationAttributes = Optional<
  OrganizationInviteAttributes,
  "id" | "acceptedAt"
>;

export class OrganizationInvite
  extends Model<
    OrganizationInviteAttributes,
    OrganizationInviteCreationAttributes
  >
  implements OrganizationInviteAttributes
{
  declare id: string;
  declare organizationId: string;
  declare email: string;
  declare role: "admin" | "member";
  declare tokenHash: string;
  declare expiresAt: Date;
  declare acceptedAt: Date | null;
  declare createdAt?: Date;

  static initModel(sequelize: Sequelize) {
    OrganizationInvite.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        organizationId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            isIn: [["admin", "member"]],
          },
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
        acceptedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "OrganizationInvite",
        tableName: "organization_invites",
        underscored: true,
        schema: "public",
        timestamps: true,
        updatedAt: false,
      },
    );

    return OrganizationInvite;
  }

  static associate(models: DbModels) {
    OrganizationInvite.belongsTo(models.Organization, {
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

export function initOrganizationInvite(sequelize: Sequelize) {
  return OrganizationInvite.initModel(sequelize);
}

export function associateOrganizationInvite(models: DbModels) {
  OrganizationInvite.associate(models);
}
