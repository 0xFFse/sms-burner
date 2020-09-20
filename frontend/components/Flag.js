import React, { Component } from 'react'
import { connect } from 'react-redux'
import { reportMessage } from '../actions/messages'

function Flag({ id, dispatch }) {
    return (
        <img title="Report message" alt="Report message" src={'/static/flag.png'} onClick={() => {
            if (window.confirm("Anmäl detta meddelande till granskning för illegalt eller opassande innehåll?"))
                dispatch(reportMessage(id));
        }} />
    )
}

export default connect(null, null)(Flag)