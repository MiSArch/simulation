import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
  private configurations = new Map<string, any>();

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initializes the module.
   * Sets all defined variables to their default values.
   */
  onModuleInit() {
    definedVariables.forEach((variable) => {
      const key = Object.keys(variable)[0] as keyof typeof variable;
      const value = variable[key]?.defaultValue;
      if (!value) {
        throw new Error(`Variable ${key} does not have a default value`);
      }
      this.setVariables({ [key]: value });
    });
  }

  /**
   * Returns the service variable definitions.
   * @returns The variable definitions as key value pairs.
   */
  getDefinedVariables() {
    return definedVariables.reduce((acc: Record<string, any>, current) => {
      const key = Object.keys(current)[0] as keyof typeof current;
      acc[key] = current[key];
      return acc as Record<string, any>;
    }, {});
  }

  /**
   * Sets the service variables.
   * @param variables - The updated variables.
   */
  setVariables(variables: Record<string, any>) {
    Object.entries(variables).forEach(([key, value]) => {
      const variable = definedVariables.find((v) => Object.keys(v)[0] === key);
      if (!variable) {
        throw new Error(`Variable ${key} is not defined`);
      }
      const type = Object.values(variable)[0]?.type.type;
      // cast the value to the correct type
      switch (type) {
        case 'number':
          value = Number(value);
          break;
        case 'integer':
          value = parseInt(value, 10);
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
      this.logger.log(`Setting variable ${key} to ${value}`);
      this.configurations.set(key, value);
    });
  }

  /**
   * Returns the current value of a variable.
   * @param name - The name of the variable.
   * @param fallback - The value to return if the variable is not defined.
   * @returns The value of the variable with the requested type.
   */
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
