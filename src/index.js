import React, { Component, createContext, forwardRef } from 'react'

const wrapActions = (actions, self) => {
  if (typeof actions === 'function') {
    return (...args) => {
      let result = actions(...args)

      if (typeof result === 'function') {
        result = result(self.state)
      }

      return new Promise(res =>
        // incase result is a promise
        Promise.resolve(result).then(state => {
          self.setState(state, res)
        })
      )
    }
  }

  return Object.entries(actions).reduce(
    (acc, [key, action]) => ({
      ...acc,
      [key]: wrapActions(action, self)
    }),
    {}
  )
}

const wrapMapToProps = (mapper, defaultKey) => {
  if (typeof mapper === 'function') {
    return mapper
  }

  if (typeof mapper === 'string') {
    return state => ({ [mapper]: state[mapper] })
  }

  if (Array.isArray(mapper)) {
    return state => mapper.reduce(
      (acc, key) => ({ ...acc, [key]: state[key] }),
      {}
    )
  }

  return val => ({ [defaultKey]: val })
}

const createStore = (store = {}) => {
  const Context = createContext()

  const Consumer = ({ mapStateToProps, mapActionToState, children}) => (
    <Context.Consumer>
      {({ state, actions }) => children({
        ...wrapMapToProps(mapStateToProps, 'state')(state),
        ...wrapMapToProps(mapActionToState, 'actions')(actions)
      })}
    </Context.Consumer>
  )

  const consume = (mapStateToProps, mapActionToState) => Wrapped => {
    const Comp = forwardRef((props, ref) => (
      <Consumer mapStateToProps={mapStateToProps}
                mapActionToState={mapActionToState}>
        {context => <Wrapped {...props} {...context} ref={ref}/>}
      </Consumer>
    ))

    Comp.displayName = `${Wrapped.displayName || Wrapped.name}_CONSUME`

    return Comp
  }

  class Provider extends Component {
    state = store.initialState || {}
    actions = wrapActions(store.actions || {}, this)

    render () {
      return (
        <Context.Provider value={{ state: this.state, actions: this.actions }}>
          {this.props.children}
        </Context.Provider>
      )
    }
  }

  const provide = Wrapped => {
    const Comp = forwardRef((props, ref) => (
      <Provider>
        <Wrapped {...props} ref={ref}/>
      </Provider>
    ))

    Comp.displayName = `${Wrapped.displayName || Wrapped.name}_PROVIDE`

    return Comp
  }

  return {
    Provider,
    Consumer,
    provide,
    consume
  }
}

export default createStore
