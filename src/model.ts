import Field, { InitialValue, validate, validateAllConstraints } from './field'
import Constraints, { ConstraintsErrorPayload } from './constraints'
import field from './field'

export default class Model<UiConfig, Prototype> {
  readonly name: string
  readonly fields: Field<UiConfig, any, keyof Prototype>[]
  readonly fieldsMap: Map<keyof Prototype, Field<UiConfig, any, keyof Prototype>>

  constructor (name: string) {
    this.name = name
    this.fields = []
    this.fieldsMap = new Map()
    for (let field of this.fields) {
    }
  }

  add<Key extends keyof Prototype> (name: Key, type: string, ui: UiConfig, constraints: Constraints<Prototype[Key]>[], initialValue?: InitialValue<Prototype[Key]>) {
    const field = new Field<UiConfig, Prototype[Key], Key>(name, type, ui, constraints, initialValue)
    this.fields.push(field)
    this.fieldsMap.set(field.name, field)
  }

  makeFormCoordinator (): ModelFormCoordinator<UiConfig, Prototype> {
    return new ModelFormCoordinator<UiConfig, Prototype>(this)
  }
}

abstract class ModelCoordinator<UiConfig, Prototype> {
  readonly model: Model<UiConfig, Prototype>

  protected constructor (model: Model<UiConfig, Prototype>) {
    this.model = model
  }

  normalize (initialData: Partial<Prototype>): Prototype {
    const newObj = {} as Prototype
    for (let field of this.model.fields) {
      const original = initialData[field.name]
      if (original === null || original === undefined) {
        newObj[field.name] = field.makeInitialValue()
      } else {
        newObj[field.name] = original
      }
    }
    return Object.seal(newObj)
  }
}

export class ModelFormCoordinator<UiConfig, Prototype> extends ModelCoordinator<UiConfig, Prototype> {
  constructor (model: Model<UiConfig, Prototype>) {
    super(model)
  }

  makeForm<Key> (formConfig: ModelFormUiConfig<UiConfig>): Readonly<Section<UiConfig, Prototype>[]> {
    const sections: Section<UiConfig, Prototype>[] = []
    const model = this.model
    const fieldsMap = model.fieldsMap
    for (let sectionConfig of formConfig.sections) {
      sections.push(Object.freeze({
        ui: sectionConfig.ui,
        rows: sectionConfig.fields.map(fieldConfig => {
          const name = fieldConfig.name as keyof Prototype
          if (fieldsMap.has(name)) {
            return Object.freeze(Object.assign(
              {},
              fieldsMap.get(name),
              { readonly: fieldConfig.readonly }
            ))
          } else {
            throw new Error(`Model ${ model.name } has no field '${ name }', available fields are [${ model.fields.map(field => field.name).join(', ') }]`)
          }
        })
      }))
    }
    return Object.freeze(sections)
  }

  /**
   * Make errors map for validating
   */
  makeErrorsMap (): Record<keyof Prototype, ConstraintsErrorPayload<keyof Prototype>[]> {
    const map = {} as Record<keyof Prototype, ConstraintsErrorPayload<keyof Prototype>[]>
    for (let field of this.model.fields) {
      map[field.name] = []
    }
    return Object.seal(map)
  }
}

export interface ModelFormUiConfig<UiConfig> {
  readonly sections: SectionConfig<UiConfig>[]
}

export interface SectionConfig<UiConfig> {
  readonly ui: UiConfig
  readonly fields: Array<{ name: string } & WritableConfig>
}

export interface Section<UiConfig, Prototype> {
  readonly ui: UiConfig
  readonly rows: (Field<UiConfig, any, keyof Prototype> & WritableConfig)[]
}


interface WritableConfig {
  readonly readonly: boolean
}
