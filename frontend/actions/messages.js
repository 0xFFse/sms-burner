import axios from 'axios'
import config from '../config.json'
import {
  RECEIVE_MESSAGES,
  RECEIVE_MESSAGES_ERROR,
  REPORT_MESSAGE_CONFIRMATION,
  REPORT_MESSAGE_ERROR
} from '../constants/messages'

const receiveMessages = (resp) => ({
  type: RECEIVE_MESSAGES,
  messages: resp.data
})

const receiveMessagesError = (error) => ({
  type: RECEIVE_MESSAGES_ERROR,
  error: error
})

const reportMessageConfirmation = (id) => ({
  type: REPORT_MESSAGE_CONFIRMATION,
  id
})

const reportMessageError = (error) => ({
  type: REPORT_MESSAGE_ERROR,
  error: error
})

export const fetchMessages = (lastId) => (
  dispatch => (
    axios.get(config.messageAPIUrl + (lastId ? '?from=' + (lastId + 1) : ''))
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

export const reportMessage = (id) => (
  dispatch => (
    axios.get(config.reportMessageAPIUrl.replace(':id', id.toString()))
      .then(resp => dispatch(
        // Data received
        reportMessageConfirmation(id)
      ))
      .catch(function (error) {
        // Error while getting data
        reportMessageError(error)
      })
  )
)