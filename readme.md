# react-minimal-context

## APIs
#### Provider
```jsx
const store = {
  initialState: {...},
  actions: {...},
}

<Provider store={store}>
  <App/>
</Provider>
```

#### provide
HOC version of ```Provider```

```jsx
const store = {
  initialState: {...},
  actions: {...},
}

@provide(store)
<App>
```

#### Consumer
```jsx
const UserList = (props) =>
  <Consumer mapStateToProps={'users'}
            mapActionToState={'userActions'}
  >
    {context => {...}}
  </Consumer>
```

#### consume
HOC version of ```Consumer ```

```jsx
// extract props by string
@consume('users', 'userActions')
class UserList extends Component {}

// extract props by array
@consume(['users'], ['userActions'])
class UserList extends Component {}

// extract props by function
@consume(
  ({ users }) => ({ users }),
  ({ userActions }) => ({ userActions })
)
class UserList extends Component {}
```

## Todos
 * tests
 * examples
 * check type

## Example
```jsx
import React, { Component, StrictMode } from 'react'
import { consume, provide } from 'react-minimal-context'

const delay = ms => new Promise(res => setTimeout(res, ms))

const userActions = {
  add: (name, id) => ({ users }) => ({ users: [...users, { name, id }] }),
  remove: (id) => ({ users }) => ({ users: users.filter(u => u.id !== id) }),
  clear: () => ({ users: [] }),
  toggleSelect: (id) => ({ users }) => ({
    users: users.map(u => u.id === id ? ({...u, selected: !u.selected}) : u)
  })
}

const photoActions = {
  add: (owner, id) => ({ photos }) => ({ photos: [...photos, { owner, id }] }),
  remove: (id) => ({ photos }) => ({ photos: photos.filter(p => p.id !== id) }),
  clear: () => ({ photos: [] }),
  delayRemove: (id) => async ({ photos }) => {
    await delay(1000)
    return { photos: photos.filter(p => p.id !== id) }
  }
}

const actions = {
  userActions,
  photoActions
}

const initialState = {
  users: [
    { name: 'name1', id: 1, selected: true },
    { name: 'name2', id: 2, selected: false},
    { name: 'name3', id: 3, selected: true }
  ],
  photos: [
    { owner: 'owner1', id: 1},
    { owner: 'owner2', id: 2},
    { owner: 'owner3', id: 3},
  ]
}

const store = {
  initialState,
  actions
}

@provide(store)
class App extends Component {
  render () {
    return (
      <StrictMode>
        <UserList/>
        <SelectedUserList/>
        <PhotoList/>
      </StrictMode>
    )
  }
}

@consume('users', 'userActions')
class UserList extends Component {
  _name = React.createRef()
  _id = React.createRef()

  addUser = () => {
    this.props.userActions.add(this._name.current.value, this._id.current.value)
  }

  removeUser = (id) => {
    this.props.userActions.remove(id)
  }

  toggleSelectUser = (id) => {
    this.props.userActions.toggleSelect(id)
  }

  render () {
    return (
      <div>
        {this.props.users.map(({ id, name }) =>
          <h2 key={id}>
            {name}
            <button onClick={() => this.toggleSelectUser(id)}>toggleSelect</button>
            <button onClick={() => this.removeUser(id)}>remove</button>
          </h2>
        )}
        <input type="input" placeholder="Name" ref={this._name}></input>
        <input type="input" placeholder="ID" ref={this._id}></input>
        <button onClick={this.addUser}>add User</button>
      </div>
    )
  }
}

@consume(
  ({ users }) => ({ selectedUsers: users.filter(u => u.selected) }),
  ({ userActions: { toggleSelect } }) => ({ toggleSelect })
)
class SelectedUserList extends Component {
  render () {
    return (
      <div>
        {this.props.selectedUsers.map(({ id, name }) =>
          <h1 key={id} onClick={() => this.props.toggleSelect(id)}>
            {name}
          </h1>
        )}
      </div>
    )
  }
}

const PhotoList = consume('photos', 'photoActions')(({ photos, photoActions }) =>
  photos.map(({ id, owner }) =>
    <h1 key={id}>
      {owner}
      <button onClick={() => photoActions.delayRemove(id)}>
        delay remove
      </button>
    </h1>
  )
)

export default App
```
