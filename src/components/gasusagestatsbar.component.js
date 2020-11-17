import React, { Component } from 'react';

export default class GasUsageStatsBar extends Component {
    constructor() {
      super();
    }

    render() {
    return (   
        <div style={{"align-items": "center", "text-align": "center", "display": "flex", 
        "justify-content": "space-around", "max-height": "200px", "max-width": "900px", 
        "border": "3px solid green", "padding": "10px", "align":"center", "margin":"0 auto"}}>
            <div>
                <div>
                    <p>
                        Max Gas
                    </p>
                </div>
                <div>
                    <p id='maxGas'>
                    --
                    </p>
                </div>
            </div>
            <div>
                <div>
                    <p>
                        Min Gas
                    </p>
                </div>
                <div>
                    <p id='minGas'>
                    --
                    </p>
                </div>
            </div>
            <div>
                <div>
                    <p>
                        Average Gas
                    </p>
                </div>
                <div>
                    <p id='avgGas'>
                    --
                    </p>
                </div>
            </div>
        </div>
            
    );
    }
}