import {
  Model,
  DataTypes,
  Sequelize,
  ModelAttributes,
  ModelOptions,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes
} from 'sequelize';

export interface NetsCoreBaseModelAttributes {
  id: number;
  created: Date;
  updated: Date;
  updatedFields: Record<string, any[]> | null;
}

export class NetsCoreBaseModel<
  TModelAttributes extends object = any,
  TCreationAttributes extends object = TModelAttributes
> extends Model<
  InferAttributes<NetsCoreBaseModel<TModelAttributes, TCreationAttributes>>,
  InferCreationAttributes<NetsCoreBaseModel<TModelAttributes, TCreationAttributes>>
> {
  declare id: CreationOptional<number>;
  declare created: CreationOptional<Date>;
  declare updated: CreationOptional<Date>;
  declare updatedFields: CreationOptional<Record<string, any[]> | null>;

  static JSON_DATA_FIELDS?: string[];
  static PROTECTED_FIELDS?: string[];

  static getProtectedFields(): string[] {
    return this.PROTECTED_FIELDS || [];
  }

  static getGlobalProtectedFields(): string[] {
    return [
      'password',
      'is_active',
      'enabled',
      'staff',
      'superuser',
      'verified',
      'deleted',
      'token',
      'auth',
      'perms',
      'groups',
      'ip',
      'doc',
      'permissions',
      'date_joined',
      'last_login',
      'verified',
      'updated_fields'
    ];
  }

  toJSON(fields?: string[] | '__all__'): any {
    // Get all attributes from the model
    const values = super.toJSON() as any;
    
    let fieldsToInclude: string[];

    if (fields === '__all__') {
      fieldsToInclude = Object.keys(values);
    } else if (fields) {
      fieldsToInclude = fields;
    } else if ((this.constructor as typeof NetsCoreBaseModel).JSON_DATA_FIELDS) {
      fieldsToInclude = (this.constructor as typeof NetsCoreBaseModel).JSON_DATA_FIELDS!;
    } else {
      fieldsToInclude = Object.keys(values);
    }

    // Filter protected fields
    const protectedFields = [
      ...(this.constructor as typeof NetsCoreBaseModel).getProtectedFields(),
      ...(this.constructor as typeof NetsCoreBaseModel).getGlobalProtectedFields()
    ].map(f => f.toLowerCase());

    const result: any = {};
    
    for (const field of fieldsToInclude) {
      const lowerField = field.toLowerCase();
      let isProtected = false;

      for (const protectedField of protectedFields) {
        if (protectedField.endsWith('*')) {
          if (lowerField.startsWith(protectedField.slice(0, -1))) {
            isProtected = true;
            break;
          }
        } else if (lowerField === protectedField || lowerField.includes(protectedField)) {
          isProtected = true;
          break;
        }
      }

      if (!isProtected && field in values) {
        result[field] = values[field];
      }
    }

    return result;
  }

  trackFieldChanges(field: string, oldValue: any, newValue: any): void {
    if (!this.updatedFields) {
      this.updatedFields = {};
    }

    if (!this.updatedFields[field]) {
      this.updatedFields[field] = [];
    }

    this.updatedFields[field].push({
      old: String(oldValue),
      new: String(newValue),
      time: new Date().toISOString()
    });
  }
}

export const NetsCoreBaseModelAttributes: ModelAttributes = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  created: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedFields: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  }
};

export interface OwnedModelAttributes extends NetsCoreBaseModelAttributes {
  userId: number;
}

export class OwnedModel<
  TModelAttributes extends object = any,
  TCreationAttributes extends object = TModelAttributes
> extends NetsCoreBaseModel<TModelAttributes, TCreationAttributes> {
  declare userId: number;
}

export const OwnedModelAttributes: ModelAttributes = {
  ...NetsCoreBaseModelAttributes,
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
};

export const initBaseModel = (sequelize: Sequelize) => {
  // This function can be used to initialize any base model configurations
  // if needed in the future
};
