import { RECEIVE_NUMBERS } from '../constants/numbers'

// Initial state object
const initialState = {
  numbers : [],
  loaded : true,
  error : false
}

/**
 * Phone numbers reducer
 * @param  {object} state  current state
 * @param  {object} action action object to execute
 * @return {object}        state
 */
const numbers = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_NUMBERS:
      return {
        ...state,
        numbers : action.numbers,
        loaded : true,
        error : false
      }
    default:
      return state
  }
}

export default numbers
