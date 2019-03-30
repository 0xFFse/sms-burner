import React, { Component } from 'react'
import { connect } from 'react-redux'
import Message from '../components/Message'
import { fetchMessages } from '../actions/messages'

/**
 * MessageList component to display list of messages
 */
class MessagesList extends Component {

  componentDidMount() {
    // Get initial set of messages
    const { dispatch } = this.props
    dispatch(fetchMessages())

    // Get messages every 5 sec
    this.interval = setInterval(() => {
      dispatch(fetchMessages())
    }, 5000)
  }

  componentWillUnmount() {
    // Stop inverval on unmount
    clearInterval(this.interval)
  }

  render() {
    const { messages, loaded, error } = this.props

    return (
      <div className={'messagelist'}>
        <div className={'title'}>
          <h3>Messages by time</h3>
          <p className={'refresh-status'}> (refreshes every 5 seconds)</p>
        </div>
        { messages.map((message, i) => {
          return <Message message={message} key={i} />;
        }) }

        { (messages.length === 0 && loaded) &&
          <span>No recent messages</span>
        }

        { (error) &&
          <span>Error while getting messages</span>
        }

      </div>
    )
  }
}

const mapStateToProps = ({messages}) => ({
  messages: messages.messages,
  loaded: messages.loaded,
  error: messages.error
})

export default connect(
  mapStateToProps,
  null
)(MessagesList)
