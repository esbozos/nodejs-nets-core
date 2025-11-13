import {
  DataTypes,
  Sequelize,
  ModelAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from 'sequelize';
import { NetsCoreBaseModel, NetsCoreBaseModelAttributes } from './base';
import bcrypt from 'bcrypt';

export interface UserAttributes {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  dateJoined: Date;
  created: Date;
  updated: Date;
  updatedFields: Record<string, any[]> | null;
}

export class User extends NetsCoreBaseModel<UserAttributes> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare username: CreationOptional<string>;
  declare firstName: CreationOptional<string>;
  declare lastName: CreationOptional<string>;
  declare password: CreationOptional<string>;
  declare isActive: CreationOptional<boolean>;
  declare isStaff: CreationOptional<boolean>;
  declare isSuperuser: CreationOptional<boolean>;
  declare emailVerified: CreationOptional<boolean>;
  declare lastLogin: CreationOptional<Date>;
  declare dateJoined: CreationOptional<Date>;

  static JSON_DATA_FIELDS = ['id', 'email', 'username', 'firstName', 'lastName', 'isActive', 'emailVerified', 'lastLogin', 'dateJoined'];
  static PROTECTED_FIELDS = ['password', 'isStaff', 'isSuperuser'];

  async setPassword(password: string): Promise<void> {
    this.password = await bcrypt.hash(password, 10);
  }

  async checkPassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ where: { email: email.toLowerCase() } as any });
  }

  static async findByUsername(username: string): Promise<User | null> {
    return await this.findOne({ where: { username: username.toLowerCase() } as any });
  }
}

export const UserModelAttributes: ModelAttributes = {
  ...NetsCoreBaseModelAttributes,
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isStaff: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isSuperuser: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateJoined: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
};

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(UserModelAttributes, {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated',
    hooks: {
      beforeSave: async (user: User) => {
        if (user.email) {
          user.email = user.email.toLowerCase();
        }
        if (user.username) {
          user.username = user.username.toLowerCase();
        }
      }
    }
  });

  return User;
};
