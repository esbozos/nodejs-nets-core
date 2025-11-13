import {
  DataTypes,
  Sequelize,
  ModelAttributes,
  CreationOptional,
  Association,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
} from 'sequelize';
import { NetsCoreBaseModel, NetsCoreBaseModelAttributes } from './base';

export interface PermissionAttributes {
  id: number;
  name: string;
  codename: string;
  description?: string;
  created: Date;
  updated: Date;
}

export class Permission extends NetsCoreBaseModel<PermissionAttributes> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare codename: string;
  declare description: CreationOptional<string>;

  static JSON_DATA_FIELDS = ['id', 'name', 'codename', 'description'];

  static async getOrCreate(codename: string, name?: string): Promise<Permission> {
    const [permission] = await Permission.findOrCreate({
      where: { codename: codename.toLowerCase() } as any,
      defaults: {
        codename: codename.toLowerCase(),
        name: name || codename,
      } as any,
    });
    return permission;
  }
}

export interface RoleAttributes {
  id: number;
  name: string;
  codename: string;
  description: string;
  projectContentType?: string;
  projectId?: number;
  enabled: boolean;
  created: Date;
  updated: Date;
}

export class Role extends NetsCoreBaseModel<RoleAttributes> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare codename: string;
  declare description: string;
  declare projectContentType: CreationOptional<string>;
  declare projectId: CreationOptional<number>;
  declare enabled: CreationOptional<boolean>;

  // Associations
  declare getPermissions: BelongsToManyGetAssociationsMixin<Permission>;
  declare addPermission: BelongsToManyAddAssociationMixin<Permission, number>;

  static JSON_DATA_FIELDS = ['id', 'name', 'codename', 'description', 'projectId', 'enabled'];

  async hasPermission(permissionCodename: string): Promise<boolean> {
    const permissions = await this.getPermissions({
      where: { codename: permissionCodename.toLowerCase() },
    });
    return permissions.length > 0;
  }
}

export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permissionId: number;
  customName?: string;
  created: Date;
  updated: Date;
}

export class RolePermission extends NetsCoreBaseModel<RolePermissionAttributes> {
  declare id: CreationOptional<number>;
  declare roleId: number;
  declare permissionId: number;
  declare customName: CreationOptional<string>;

  static JSON_DATA_FIELDS = ['id', 'roleId', 'permissionId', 'customName'];
}

export interface UserRoleAttributes {
  id: number;
  userId: number;
  roleId: number;
  projectContentType?: string;
  projectId?: number;
  created: Date;
  updated: Date;
}

export class UserRole extends NetsCoreBaseModel<UserRoleAttributes> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare roleId: number;
  declare projectContentType: CreationOptional<string>;
  declare projectId: CreationOptional<number>;

  static JSON_DATA_FIELDS = ['id', 'userId', 'roleId', 'projectContentType', 'projectId'];
}

export const PermissionModelAttributes: ModelAttributes = {
  ...NetsCoreBaseModelAttributes,
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  codename: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
};

export const RoleModelAttributes: ModelAttributes = {
  ...NetsCoreBaseModelAttributes,
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  codename: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  projectContentType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
};

export const RolePermissionModelAttributes: ModelAttributes = {
  ...NetsCoreBaseModelAttributes,
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nets_core_role',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nets_core_permission',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  customName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
};

export const UserRoleModelAttributes: ModelAttributes = {
  ...NetsCoreBaseModelAttributes,
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nets_core_role',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  projectContentType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
};

export const initPermissionModels = (sequelize: Sequelize) => {
  Permission.init(PermissionModelAttributes, {
    sequelize,
    tableName: 'nets_core_permission',
    modelName: 'Permission',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated',
  });

  Role.init(RoleModelAttributes, {
    sequelize,
    tableName: 'nets_core_role',
    modelName: 'Role',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated',
    indexes: [
      {
        fields: ['project_content_type', 'project_id'],
        name: 'role_index',
      },
    ],
  });

  RolePermission.init(RolePermissionModelAttributes, {
    sequelize,
    tableName: 'nets_core_role_permission',
    modelName: 'RolePermission',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated',
  });

  UserRole.init(UserRoleModelAttributes, {
    sequelize,
    tableName: 'nets_core_user_role',
    modelName: 'UserRole',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated',
  });

  // Set up associations
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
  });

  return { Permission, Role, RolePermission, UserRole };
};
