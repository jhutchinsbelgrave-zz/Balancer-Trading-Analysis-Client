import React from 'react';
import {useState} from 'react';
import DateTimePicker from 'react-datetime-picker';

function StartDate () {
    var today = new Date();
    const [value, onChange] = useState(today);
    
    return (
        <div>
        <h3>
            Start Date
        </h3>
        <DateTimePicker
            onChange={onChange}
            value={value}
        />
        </div>
    );
}

export default StartDate;