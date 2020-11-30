import React, { Component } from 'react';

export default class GasUsageStatsBar extends Component {
    constructor() {
      super();
    }

    render() {
    return (   
        <div style={{"alignItems": "center", "textAlign": "center", "display": "flex", 
        "justifyContent": "space-around", "maxHeight": "200px", "maxWidth": "900px", 
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