import axios from 'axios'
import config from '../config.json'
import {
  RECEIVE_MESSAGES,
  RECEIVE_MESSAGES_ERROR
} from '../constants/messages'

const receiveMessages = (resp) => ({
  type: RECEIVE_MESSAGES,
  messages: resp.data
})

const receiveMessagesError = (error) => ({
  type: RECEIVE_MESSAGES_ERROR,
  error: error
})

export const fetchMessages = () => (
  dispatch => (
    axios.get(config.messageAPIUrl)
    .then(resp => dispatch(
      // Data received
      receiveMessages(resp)
    ))
    .catch(function (error) {
      // Error while getting data
      receiveMessagesError(error)
    })
  )
)
