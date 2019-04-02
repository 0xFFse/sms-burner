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
          <h2>Meddelanden</h2>
          <p className={'refresh-status'}> (uppdateras var 5 sekund)</p>
        </div>
        { messages.map((message, i) => {
          return <Message message={message} key={i} />;
        }) }

        { (messages.length === 0 && loaded) &&
          <span>Inga meddelanden</span>
        }

        { (error) &&
          <span>Ett fel uppstod vid h&auml;ntning av meddelanden</span>
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
