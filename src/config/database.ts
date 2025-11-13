import { Sequelize, Options } from 'sequelize';
import { NetsCoreConfig } from '../types';

let sequelizeInstance: Sequelize | null = null;

export const initializeDatabase = (config: NetsCoreConfig['database']): Sequelize => {
  const options: Options = {
    dialect: config.dialect,
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password,
    storage: config.storage,
    logging: config.logging ?? false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'updated'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };

  sequelizeInstance = new Sequelize(options);
  
  return sequelizeInstance;
};

export const getDatabase = (): Sequelize => {
  if (!sequelizeInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return sequelizeInstance;
};

export const closeDatabase = async (): Promise<void> => {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
  }
};
