import MessageDate from './MessageDate'
import Flag from './Flag'

/**
 * Single message component
 */
function Message({ message }) {
  return (
    <article className={'row'}>
      <div className={'meta'}>
        <MessageDate ts={message.ts} />
        <span className={'from_txt'}> {message.fromNumber}</span>
      </div>
      <div className={'message'}>
        <p>
          {message.msg}
        </p>
      </div>
      <div className={'report'}>
        {(!message.reported) &&
          <Flag id={message.id} />
        }
      </div>
    </article>
  );
}

export default Message;
