import MessageDate from './MessageDate'

/**
 * Single message component
 */
function Message({ message }) {
  return (
    <article className={'row'}>
      <div className={'received_at'}>
          <MessageDate ts={message.ts} /> { message.fromNumber }
      </div>
      <div className={'message'}>
        <p>
          { message.msg }
        </p>
      </div>
    </article>
  );
}

export default Message;
