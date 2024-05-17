import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { definedVariables } from './variable-definitions/variable-definitions';
import { ConfigService } from '@nestjs/config';

/**
 * The configuration service for the simulation.
 * It allows exposed variables to be queried and set by the sidecar.
 * It wraps the default nest configService for other, not exposed variables.
 * @property configurations - The internal storage for all exposed variables.
 */
@Injectable()
export class ConfigurationService implements OnModuleInit {
  // 
  private configurations = new Map<string, any>();

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // set default values to internal variable management
    definedVariables.forEach((variable) => {
      const key = Object.keys(variable)[0] as keyof typeof variable;
      const value = variable[key]?.defaultValue;
      if (!value) {
        throw new Error(`Variable ${key} does not have a default value`);
      }
      this.logger.log(`Setting variable ${key} to default "${JSON.stringify(value)}"`);
      this.configurations.set(key, value);
    });
  }

  getDefinedVariables() {
    return definedVariables;
  }

  setVariables(variables: Record<string, any>) {
    Object.entries(variables).forEach(([key, value]) => {
      this.logger.log(`Setting variable ${key} to "${JSON.stringify(value)}"`);
      // cast value to defined type
      const variable = definedVariables.find((v) => Object.keys(v)[0] === key);
      if (!variable) {
        throw new Error(`Variable ${key} is not defined`);
      }
      const type = Object.values(variable)[0]?.type.type;
      switch (type) {
        case 'number':
          value = Number(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'string':
          value = String(value);
          break;
        default:
          throw new Error(`Variable ${key} has an unsupported type ${type}`);
      }
      this.configurations.set(key, value);
    });
  }

  getCurrentVariableValue<T>(name: string, fallback: T): T {
    const value = this.configurations.get(name);
    if (value !== undefined) {
      return value as T;
    }
    const envValue = this.configService.get(name);
    if (envValue !== undefined) {
      return envValue as T;
    }
    this.logger.error(`Variable ${name} is not defined`);
    return fallback;
  }
}
