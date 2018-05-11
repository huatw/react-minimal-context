import React, { PureComponent, createContext } from 'react'

const wrapActions = (actions, self) => {
  if (typeof actions === 'function') {
    return (...args) => {
      let result = actions(...args)

      if (typeof result === 'function') {
        result = result(self.state)
      }

      // incase result is a promise
      // note: setState is async, no need to distinguish result type.
      return new Promise((res, rej) =>
        Promise.resolve(result)
          .then(state => {
            if (typeof state !== 'object') {
              return res()
            }
            self.setState(state, res)
          })
          .catch(rej)
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

const wrapMapToProps = (mapper) => {
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

  return _ => {}
}

const createStore = (store = {}) => {
  const Context = createContext()

  const Consumer = ({ mapStateToProps, mapActionToState, children}) => (
    <Context.Consumer>
      {({ state, actions }) => children({
        ...wrapMapToProps(mapStateToProps)(state),
        ...wrapMapToProps(mapActionToState)(actions)
      })}
    </Context.Consumer>
  )

  const consume = (mapStateToProps, mapActionToState) => Wrapped => {
    const Comp = (props) => (
      <Consumer mapStateToProps={mapStateToProps}
                mapActionToState={mapActionToState}>
        {context => <Wrapped {...props} {...context}/>}
      </Consumer>
    )

    Comp.displayName = `${Wrapped.displayName || Wrapped.name}_CONSUME`

    return Comp
  }

  class Provider extends PureComponent {
    state = store.initialState || {}
    actions = wrapActions(store.actions || {}, this)
    value = { actions: this.actions, state: this.state }

    render () {
      if (this.state !== this.value.state) {
        this.value = { ...this.value, state: this.state }
      }

      return (
        <Context.Provider value={this.value}>
          {this.props.children}
        </Context.Provider>
      )
    }
  }

  const provide = Wrapped => {
    const Comp = (props) => (
      <Provider>
        <Wrapped {...props}/>
      </Provider>
    )

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