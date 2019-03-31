/**
 * MessageDate message component
 */
const MessageDate = ({ ts }) => {

  const pad = (n) => (
    n < 10 ? '0'+n : n
  )

  const formatDate = (date) => {
    const day = pad(date.getDate())
    const month = pad(date.getMonth()+1)
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return day + '/' + month + '-' + year + ' '+ hours + ':' + minutes;
  }

  const date = new Date(ts)
  const timestamp = date.getTime()
  const displayDate = formatDate(date)

  return (
    <time dateTime={ timestamp }>{ displayDate }</time>
  );
}

export default MessageDate;
