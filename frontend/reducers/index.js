import { combineReducers } from 'redux'
import messages from './messages'
import numbers from './numbers'

export default combineReducers({
  messages,
  numbers
})
