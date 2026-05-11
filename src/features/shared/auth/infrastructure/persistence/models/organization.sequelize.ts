import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import type { DbModels } from "@/infrastructure/db/types.js";

export interface OrganizationAttributes {
  id: string;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type OrganizationCreationAttributes = Optional<
  OrganizationAttributes,
  "id"
>;

export class Organization
  extends Model<OrganizationAttributes, OrganizationCreationAttributes>
  implements OrganizationAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare deletedAt?: Date | null;

  static initModel(sequelize: Sequelize) {
    Organization.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Organization",
        tableName: "organizations",
        paranoid: true,
        underscored: true,
        schema: "public",
      },
    );

    return Organization;
  }

  static associate(models: DbModels) {
    Organization.hasMany(models.Membership, {
      as: "memberships",
      foreignKey: {
        name: "organizationId",
        field: "organization_id",
        allowNull: false,
      },
      onDelete: "CASCADE",
    });

    Organization.hasMany(models.OrganizationInvite, {
      as: "invites",
      foreignKey: {
        name: "organizationId",
        field: "organization_id",
        allowNull: false,
      },
      onDelete: "CASCADE",
    });
  }
}

export function initOrganization(sequelize: Sequelize) {
  return Organization.initModel(sequelize);
}

export function associateOrganization(models: DbModels) {
  Organization.associate(models);
}
