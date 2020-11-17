import React, { Component } from 'react';
import DateBar from './datebar.component';

export default class Gas extends Component {
    constructor() {
      super();
      this.state = {
      };
    }

    render() {
    return (
        <div className = "container">
            <DateBar/>
        </div>
    );
    }
}