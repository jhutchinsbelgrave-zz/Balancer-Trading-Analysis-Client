import React, { Component } from 'react';

export default class GasPriceStatsBar extends Component {
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
                        Max Gas Price
                    </p>
                </div>
                <div>
                    <p id='maxGasPr'>
                    --
                    </p>
                </div>
            </div>
            <div>
                <div>
                    <p>
                        Min Gas Price
                    </p>
                </div>
                <div>
                    <p id='minGasPr'>
                    --
                    </p>
                </div>
            </div>
            <div>
                <div>
                    <p>
                        Average Gas Price
                    </p>
                </div>
                <div>
                    <p id='avgGasPr'>
                    --
                    </p>
                </div>
            </div>
        </div>
            
    );
    }
}