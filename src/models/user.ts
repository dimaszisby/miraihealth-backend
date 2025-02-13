import { Model, DataTypes, Sequelize } from "sequelize";
import bcrypt from "bcrypt";

/**
 * * User Model
 * Defines the schema and associations for the User entity.
 */

export interface UserAttributes {
  id?: string;
  username: string;
  email: string;
  password: string;
  age?: number;
  sex: "male" | "female" | "other" | "prefer not to specify";
  isPublicProfile: boolean;
  deletedAt?: Date | null;
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  validPassword(password: string): Promise<boolean>;
}

export default (sequelize: Sequelize) => {
  class User extends Model<UserAttributes, UserInstance> implements UserInstance {
    id!: string;
    username!: string;
    email!: string;
    password!: string;
    age?: number;
    sex!: "male" | "female" | "other" | "prefer not to specify";
    isPublicProfile!: boolean;
    deletedAt?: Date | null;

    /**
     * * Associations
     */
    static associate(models: any) {
      User.hasMany(models.Metric, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
      User.hasMany(models.MetricCategory, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }

    /**
     * * Compare passwords for authentication
     */
    async validPassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sex: {
        type: DataTypes.ENUM("male", "female", "other", "prefer not to specify"),
        allowNull: false,
        defaultValue: "prefer not to specify",
      },
      isPublicProfile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      paranoid: true,
      underscored: true,
      schema: "public",
      hooks: {
        /**
         * * Hash password before saving
         */
        beforeCreate: async (user: UserInstance) => {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        },
        beforeUpdate: async (user: UserInstance) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};
