import { ParamType, RequestParamOptions } from '../types';
import {
  isValidEmail,
  parseBoolean,
  parseInteger,
  parseFloat as parseFloatUtil,
  parseDate,
  parseArray,
  parseObject
} from '../utils';
import validator from 'validator';

export class RequestParam {
  private errors = {
    required: (key: string) => `Parameter "${key}" is required`,
    invalidValue: (key: string, value: any, type: ParamType) => 
      `Parameter "${key}" has invalid value "${value}" for type "${type}"`,
    invalidType: (key: string, type: ParamType) => 
      `Invalid parameter type "${type}" for "${key}"`
  };

  constructor(
    public key: string,
    public type: ParamType,
    public optional: boolean = false,
    public options: RequestParamOptions = {}
  ) {}

  private getFileFromRequest(files: any): any {
    try {
      const file = files[this.key];
      
      if (!file && !this.optional) {
        throw new Error(this.errors.required(this.key));
      }

      if (!file) {
        return this.options.default || null;
      }

      // Validate file types if specified
      if (this.options.filetypes && this.options.filetypes.length > 0) {
        const mimeType = file.mimetype;
        if (!this.options.filetypes.includes(mimeType)) {
          throw new Error(
            `File type "${mimeType}" is not allowed for parameter "${this.key}"`
          );
        }
      }

      return file;
    } catch (error: any) {
      if (this.optional) {
        return this.options.default || null;
      }
      throw error;
    }
  }

  getValue(data: Record<string, any>, project?: any): any {
    let value = data[this.key];

    // Handle boolean type specially
    if (this.type === 'bool' || this.type === 'boolean') {
      if (value === undefined || value === null) {
        return this.optional ? (this.options.default ?? false) : false;
      }
      return parseBoolean(value);
    }

    // Handle 0 or '0' as valid values
    if (value === 0 || value === '0') {
      return 0;
    }

    // Check if value is provided
    if (!value && !this.optional && !(['bool', 'boolean'].includes(this.type as string))) {
      throw new Error(this.errors.required(this.key));
    }

    // Return default if optional and no value
    if (!value && this.optional) {
      return this.options.default !== undefined ? this.options.default : null;
    }

    // Handle dict/object from select components
    if (typeof value === 'object' && value !== null && 'value' in value && this.type !== 'object' && this.type !== 'dict') {
      value = value.value;
    }

    // Final check for required values
    if (value === null && !this.optional && !(['bool', 'boolean'].includes(this.type as string))) {
      throw new Error(this.errors.required(this.key));
    }

    if (value === null && !(['bool', 'boolean'].includes(this.type as string))) {
      return null;
    }

    // Type conversion
    try {
      value = this.convertType(value);
    } catch (error: any) {
      throw new Error(this.errors.invalidValue(this.key, value, this.type));
    }

    // Custom validation
    if (this.options.validate) {
      const isValid = project 
        ? this.options.validate(value, project)
        : this.options.validate(value);
      
      if (!isValid) {
        throw new Error(this.errors.invalidValue(this.key, value, this.type));
      }
    }

    return value;
  }

  private convertType(value: any): any {
    switch (this.type) {
      case 'string':
      case 'str':
        return String(value);

      case 'int':
      case 'integer':
        return parseInteger(value);

      case 'float':
      case 'number':
        return parseFloatUtil(value);

      case 'bool':
      case 'boolean':
        return parseBoolean(value);

      case 'date':
      case 'datetime':
        return parseDate(value);

      case 'email': {
        const email = String(value).toLowerCase();
        if (!validator.isEmail(email)) {
          throw new Error(`Invalid email address: ${value}`);
        }
        return email;
      }

      case 'list':
      case 'array':
        if (typeof value === 'string') {
          return parseArray(value);
        }
        if (Array.isArray(value)) {
          return value;
        }
        throw new Error(`Cannot convert to array: ${value}`);

      case 'object':
      case 'dict':
        if (typeof value === 'string') {
          return parseObject(value);
        }
        if (typeof value === 'object' && value !== null) {
          return value;
        }
        throw new Error(`Cannot convert to object: ${value}`);

      case 'file':
        // File handling is done separately
        return value;

      default:
        throw new Error(this.errors.invalidType(this.key, this.type));
    }
  }

  toString(): string {
    return `RequestParam(key="${this.key}", type="${this.type}", optional=${this.optional}, default=${this.options.default})`;
  }
}
