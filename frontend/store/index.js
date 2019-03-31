import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'

const middlewares = [thunkMiddleware]

// Don't use logger in production
const dev = process.env.NODE_ENV !== 'production'
if (dev) {
  const { createLogger } = require('redux-logger')
  const loggerMiddleware = createLogger()
  middlewares.push(loggerMiddleware)
}

/**
 * Create store from reducers and use Think & logger middlewares.
 */
export const Store = createStore(
  rootReducer,
  applyMiddleware(
    ...middlewares
  )
)
