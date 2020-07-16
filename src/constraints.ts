/**
 * Constraint is a constraint to data
 */
export default interface Constraints<DataType> {

  /**
   * name of the constraint. likely to be used in debugging.
   */
  readonly name: string

  validate (value: DataType, ui: any): ConstraintErrorResult | null
}

export interface ConstraintErrorResult {
  readonly name: string
  readonly message: string
}

export type ConstraintsErrorPayload<Key> = ConstraintErrorResult & {
  readonly objectName: Key
}

const constraintFactories: { [key: string]: (any: any) => Constraints<any> } = {}

type ConstraintBuilderConfig<Arguments, DataType> = {
  message: string | ((args: Arguments, ui: any) => string)
  validate (value: DataType, args: Arguments): boolean
}

export function createConstraint (type: string, name: string, arg: any): Constraints<any> {
  name = `${ name }.${ type }`
  if (!(name in constraintFactories)) {
    throw new Error(`Unknown constraint factory '${ name }'`)
  }
  return constraintFactories[name](arg)
}

export function registerConstraintFactory<Argument, DataType> (type: string, name: string, config: ConstraintBuilderConfig<Argument, DataType>) {
  name = `${ name }.${ type }`
  if (name in constraintFactories) {
    throw new Error(`Constraint '${ name } was already registered'.`)
  }

  function buildMessage (message: string | ((args: Argument, ui: any) => string), args: Argument, ui: any) {
    if (typeof message === 'function') {
      return message(args, ui)
    } else {
      return message.replace(/{argument}/, args as unknown as string)
    }
  }

  constraintFactories[name] = (args: Argument) => ({
    name: name,
    validate (value: any, ui: any): ConstraintErrorResult | null {
      if (!config.validate(value, args)) {
        return {
          message: buildMessage(config.message, args, ui),
          name
        }
      } else {
        return null
      }
    }
  })
}
