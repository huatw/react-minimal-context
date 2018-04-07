import React, { Component, createContext, forwardRef } from 'react'

const Context = createContext()

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

  return state => ({ state })
}

const Consumer = ({ mapStateToProps, mapActionToState, children}) => (
  <Context.Consumer>
    {({ state, actions }) => children({
      ...mapStateToProps(state),
      ...mapActionToState(actions)
    })}
  </Context.Consumer>
)

const consume = (mapStateToProps, mapActionToState) => Wrapped => forwardRef(
  (props, ref) => (
    <Consumer mapStateToProps={wrapMapToProps(mapStateToProps)}
              mapActionToState={wrapMapToProps(mapActionToState)}>
      {context => <Wrapped {...props} {...context} ref={ref}/>}
    </Consumer>
  )
)

class Provider extends Component {
  state = this.props.store.initialState
  actions = wrapActions(this.props.store.actions, this)

  render () {
    return (
      <Context.Provider value={{ state: this.state, actions: this.actions }}>
        {this.props.children}
      </Context.Provider>
    )
  }
}

const provide = store => Wrapped => forwardRef(
  (props, ref) => (
    <Provider store={store}>
      <Wrapped {...props} ref={ref}/>
    </Provider>
  )
)

export {
  Provider,
  Consumer,
  provide,
  consume
}
