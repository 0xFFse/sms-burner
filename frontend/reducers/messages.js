import {
  RECEIVE_MESSAGES,
  RECEIVE_MESSAGES_ERROR
} from '../constants/messages'

// Initial state object
const initialState = {
  messages : [],
  loaded : false,
  error : false
}

/**
 * Messages reducer
 * @param  {object} state  current state
 * @param  {object} action action object to execute
 * @return {object}        state
 */
const messages = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_MESSAGES:
      return {
        ...state,
        messages : action.messages,
        loaded : true,
        error : false
      }
    case RECEIVE_MESSAGES_ERROR:
      return {
        ...state,
        error : action.error
      }
    default:
      return state
  }
}

export default messages
