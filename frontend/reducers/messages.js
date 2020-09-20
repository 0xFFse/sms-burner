import {
  RECEIVE_MESSAGES,
  REPORT_MESSAGE_CONFIRMATION,
  RECEIVE_MESSAGES_ERROR,
  REPORT_MESSAGE_ERROR
} from '../constants/messages'

// Initial state object
const initialState = {
  messages: [],
  loaded: false,
  error: false,
  lastId: undefined
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
      const messages = action.messages.concat(state.messages);
      return {
        ...state,
        messages,
        loaded: true,
        error: false,
        lastId: (messages.length > 0 ? messages[0].id : undefined)
      }
    case REPORT_MESSAGE_CONFIRMATION:
      for (const msg of state.messages) {
        if (msg.id == action.id) {
          msg.reported = true;
          break;
        }
      }
      return {
        ...state,
        messages: state.messages.slice()
      }
    case RECEIVE_MESSAGES_ERROR:
    case REPORT_MESSAGE_ERROR:
      return {
        ...state,
        error: action.error
      }
    default:
      return state
  }
}

export default messages
