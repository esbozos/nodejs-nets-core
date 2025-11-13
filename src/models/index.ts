import { Sequelize } from 'sequelize';
import { initUserModel, User } from './User';
import { initVerificationCodeModel, VerificationCode } from './VerificationCode';
import { initUserDeviceModel, UserDevice } from './UserDevice';
import { initPermissionModels, Permission, Role, RolePermission, UserRole } from './Permission';

export * from './base';
export * from './User';
export * from './VerificationCode';
export * from './UserDevice';
export * from './Permission';

export const initializeModels = (sequelize: Sequelize) => {
  // Initialize all models
  initUserModel(sequelize);
  initVerificationCodeModel(sequelize);
  initUserDeviceModel(sequelize);
  initPermissionModels(sequelize);

  // Set up associations
  User.hasMany(VerificationCode, {
    foreignKey: 'userId',
    as: 'verificationCodes'
  });

  VerificationCode.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  User.hasMany(UserDevice, {
    foreignKey: 'userId',
    as: 'devices'
  });

  UserDevice.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  VerificationCode.belongsTo(UserDevice, {
    foreignKey: 'deviceId',
    as: 'device'
  });

  UserDevice.hasMany(VerificationCode, {
    foreignKey: 'deviceId',
    as: 'verificationCodes'
  });

  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles'
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users'
  });

  return {
    User,
    VerificationCode,
    UserDevice,
    Permission,
    Role,
    RolePermission,
    UserRole
  };
};
