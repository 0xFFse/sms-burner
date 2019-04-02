import React, { Component } from 'react'

/**
 * Single active number component
 */
class ActiveNumber extends Component {

  constructor(props){
    super(props)
    // If browser supports copying
    this.copySupported = document.queryCommandSupported('copy')
  }

  // Copy a number to clipboard
  copyToClipboard = (e) => {

    // Browser doesn't support copy command
    if(!this.copySupported)
      return

    // Create a hidden (to avoid a flicker) textarea with
    // the phone number as a value of it, copies that to
    // clipboard and removes the element.
    const tempTextarea = document.createElement('textarea')
    tempTextarea.innerText = this.props.number
    tempTextarea.className = 'hidden'
    document.body.appendChild(tempTextarea)
    tempTextarea.select()
    document.execCommand('copy')
    tempTextarea.remove()
  };

  render() {
    const { number } = this.props
    return (
      <li>
        <i className={'active'}></i>
        <span
          title={(this.copySupported && 'Click to copy to clipboard')}
          className={(this.copySupported && 'copy')}
          onClick={this.copyToClipboard}
        >
          { number }
        </span>
      </li>
    )
  }
}

export default ActiveNumber
