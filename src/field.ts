import Constraints, { ConstraintsErrorPayload } from './constraints'

export type InitialValue<T> = T | {
  (): T
}

export default class Field<UiConfig, ValueType, Key> {
  readonly name: Key
  readonly type: string
  readonly ui: UiConfig
  readonly constraints: Constraints<ValueType>[]
  readonly initialValue?: ValueType | (() => ValueType)


  constructor (name: Key, type: string, ui: UiConfig, constraints: Constraints<ValueType>[], initialValue: InitialValue<ValueType>) {
    this.name = name
    this.type = type
    this.ui = ui
    this.constraints = constraints
    this.initialValue = initialValue
  }

  makeInitialValue (): ValueType | null {
    if (typeof this.initialValue === 'function') {
      return (this.initialValue as (() => ValueType))()
    } else if (typeof this.initialValue !== 'undefined') {
      return this.initialValue
    } else {
      return null
    }
  }
}

export function validate (field: Field<any, any, any>, data: any): ConstraintsErrorPayload<any> | null {
  for (let constraint of field.constraints) {
    console.debug(`validate value ${data} using ${constraint.name}`)
    const error = constraint.validate(data, field.ui)
    if (error !== null) {
      return {
        objectName: field.name,
        message: error.message,
        name: error.name
      }
    }
  }
  return null
}

export function validateAllConstraints<Key> (field: Field<any, any, Key>, data: any): ConstraintsErrorPayload<Key>[] {
  const payloads: ConstraintsErrorPayload<Key>[] = []
  for (let constraint of field.constraints) {
    const error = constraint.validate(data, field.ui)
    if (error !== null) {
      payloads.push({
        objectName: field.name,
        message: error.message,
        name: error.name
      })
    }
  }
  return payloads
}
