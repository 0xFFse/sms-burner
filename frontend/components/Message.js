import MessageDate from './MessageDate'

/**
 * Single message component
 */
function Message({ message }) {
  return (
    <article className={'row'}>
      <div className={'from'}>
        { message.fromNumber }
      </div>
      <div className={'message'}>
        <p>
          { message.msg }
        </p>
      </div>
      <div className={'received_at'}>
        <MessageDate ts={message.ts} />
      </div>
    </article>
  );
}

export default Message;
