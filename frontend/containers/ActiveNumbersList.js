import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchNumbers } from '../actions/numbers'

/**
 * Active numbers component to display list of numbers available
 */
class ActiveNumbersList extends Component {

  componentDidMount() {
    // Get initial set of numbers
    const { dispatch } = this.props
    dispatch(fetchNumbers())

    // Get numbers every 10 sec
    this.interval = setInterval(() => {
      dispatch(fetchNumbers())
    }, 10000)
  }

  componentWillUnmount() {
    // Stop inverval on unmount
    clearInterval(this.interval)
  }

  render() {
    const { numbers, loaded, error } = this.props
    return (
      <ul className={'number-list'}>
        { numbers.map((number, i) => {
          return (
            <li key={i}>
              <i className={'active'}></i>
              <a href={ 'tel:'+number }>
                { number }
              </a>
            </li>);
        }) }
      </ul>
    )
  }
}

const mapStateToProps = ({numbers}) => ({
  numbers: numbers.numbers,
  loaded: numbers.loaded,
  error: numbers.error
})

export default connect(
  mapStateToProps,
  null
)(ActiveNumbersList)
