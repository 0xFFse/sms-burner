import axios from 'axios'
import config from '../config.json'
import { RECEIVE_NUMBERS } from '../constants/numbers'

const receiveNumbers = (resp) => ({
  type: RECEIVE_NUMBERS,
  numbers: resp.data
})

export const fetchNumbers = () => (
  dispatch => (
    axios.get(config.numbersAPIUrl)
    .then(resp => dispatch(
      receiveNumbers(resp)
    ))
  )
)
