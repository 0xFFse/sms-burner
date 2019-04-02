/**
 * MessageDate message component
 */
const MessageDate = ({ ts }) => {

  const pad = (n) => (
    n < 10 ? '0'+n : n
  )

  const month = (n) => {
    switch(n) {
      case 0: return 'Jan';
      case 1: return 'Feb';
      case 2: return 'Mar';
      case 3: return 'Apr';
      case 4: return 'Maj';
      case 5: return 'Jun';
      case 6: return 'Jul';
      case 7: return 'Aug';
      case 8: return 'Sep';
      case 9: return 'Okt';
      case 10: return 'Nov';
      case 11: return 'Dec';
    }
  }

  const formatDate = (date) => {
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return date.getDate() + ' ' + month(date.getMonth()) + ' ' + hours + ':' + minutes;
  }

  const date = new Date(ts)
  const timestamp = date.getTime()
  const displayDate = formatDate(date)

  return (
    <time dateTime={ timestamp }>{ displayDate }</time>
  );
}

export default MessageDate;
