import { DataTypes, Sequelize, ModelAttributes, CreationOptional } from 'sequelize';
import { OwnedModel, OwnedModelAttributes } from './base';
import { v4 as uuidv4 } from 'uuid';

export interface UserDeviceAttributes {
  id: number;
  userId: number;
  uuid: string;
  name: string;
  os?: string;
  osVersion?: string;
  appVersion?: string;
  deviceType?: string;
  deviceToken?: string;
  firebaseToken?: string;
  active: boolean;
  lastLogin?: Date;
  ip?: string;
  created: Date;
  updated: Date;
}

export class UserDevice extends OwnedModel<UserDeviceAttributes> {
  declare id: CreationOptional<number>;
  declare uuid: CreationOptional<string>;
  declare name: string;
  declare os: CreationOptional<string>;
  declare osVersion: CreationOptional<string>;
  declare appVersion: CreationOptional<string>;
  declare deviceType: CreationOptional<string>;
  declare deviceToken: CreationOptional<string>;
  declare firebaseToken: CreationOptional<string>;
  declare active: CreationOptional<boolean>;
  declare lastLogin: CreationOptional<Date>;
  declare ip: CreationOptional<string>;

  static JSON_DATA_FIELDS = [
    'id',
    'uuid',
    'userId',
    'name',
    'os',
    'osVersion',
    'appVersion',
    'deviceType',
    'active',
    'lastLogin',
    'ip',
  ];
  static PROTECTED_FIELDS = ['deviceToken', 'firebaseToken'];

  static async validateAndCreateOrUpdate(userId: number, deviceData: any): Promise<UserDevice> {
    const validFields = [
      'name',
      'os',
      'osVersion',
      'deviceToken',
      'firebaseToken',
      'appVersion',
      'deviceId',
      'deviceType',
      'uuid',
    ];

    const filteredData: any = {};
    for (const key of validFields) {
      if (deviceData[key] !== undefined) {
        filteredData[key] = deviceData[key];
      }
    }

    // If UUID is provided, try to update existing device
    if (deviceData.uuid) {
      const existingDevice = await UserDevice.findOne({
        where: { uuid: deviceData.uuid, userId } as any,
      });

      if (existingDevice) {
        await existingDevice.update(filteredData);
        return existingDevice;
      } else {
        throw new Error('Invalid device UUID');
      }
    }

    // New device - check if firebase token already exists
    if (deviceData.firebaseToken) {
      const existingDevice = await UserDevice.findOne({
        where: { firebaseToken: deviceData.firebaseToken, userId } as any,
      });

      if (existingDevice) {
        await existingDevice.update(filteredData);
        return existingDevice;
      }
    }

    // Create new device
    const newDevice = await UserDevice.create({
      ...filteredData,
      userId,
      uuid: uuidv4(),
      active: true,
    });

    return newDevice;
  }
}

export const UserDeviceModelAttributes: ModelAttributes = {
  ...OwnedModelAttributes,
  uuid: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  os: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  osVersion: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  appVersion: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  deviceType: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  deviceToken: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  firebaseToken: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
};

export const initUserDeviceModel = (sequelize: Sequelize): typeof UserDevice => {
  UserDevice.init(UserDeviceModelAttributes, {
    sequelize,
    tableName: 'nets_core_user_device',
    modelName: 'UserDevice',
    timestamps: true,
    underscored: true,
    createdAt: 'created',
    updatedAt: 'updated',
  });

  return UserDevice;
};
