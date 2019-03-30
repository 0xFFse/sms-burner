import Moment from 'react-moment';

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
        <Moment format="DD/MM-YYYY HH:mm">
          { message.ts }
        </Moment>
      </div>
    </article>
  );
}

export default Message;
