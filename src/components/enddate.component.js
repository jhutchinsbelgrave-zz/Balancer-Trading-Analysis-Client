import React from 'react';
import {useState} from 'react';
import DateTimePicker from 'react-datetime-picker';

function EndDate () {
    const [value, onChange] = useState(new Date());
    
    return (
        <div>
        <h3>
            End Date
        </h3>
        <DateTimePicker
            onChange={onChange}
            value={value}
        />
        </div>
    );
}

export default EndDate;