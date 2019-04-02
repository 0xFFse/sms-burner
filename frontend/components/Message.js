import MessageDate from './MessageDate'

/**
 * Single message component
 */
function Message({ message }) {
  return (
    <article className={'row'}>
      <div className={'meta'}>
          <MessageDate ts={message.ts} />
          <span class={'from_txt'}> { message.fromNumber }</span>
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
