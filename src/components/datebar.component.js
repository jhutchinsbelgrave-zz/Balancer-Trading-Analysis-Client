import * as proxyArtifact from "./../abi/ExchangeProxy.json";
import React, { Component } from 'react';
import StartDate from './startdate.component';
import EndDate from './enddate.component';
import GasUsageStatsBar from './gasusagestatsbar.component';
import GasPriceStatsBar from './gaspricestatsbar.component';
import Axios from "axios"; 
import { Interface } from '@ethersproject/abi';
import { JsonRpcProvider } from '@ethersproject/providers';

const Chart = require('chart.js');
const { infura } = require('../config.js');


const server = "https://balancer-trading-analysis-svr.herokuapp.com/";


const timeFactor = (1000 * 60 * 60 * 24);

function formatNumber(num) {
    const n = Math.abs(num); // Change to positive
    const floored = Math.floor(n)
    const decimal = n - floored
    return (floored + decimal).toLocaleString(
        undefined, // leave undefined to use the browser's locale,
                   // or use a string like 'en-US' to override it.
        { minimumFractionDigits: 0 }
      ); 
}

export default class DateBar extends Component {
    constructor() {
      super();
      this.getTransactions = this.getTransactions.bind(this);
      this.submitTime = this.submitTime.bind(this);
      this.getOrganizedTransactions = this.getOrganizedTransactions.bind(this);
      this.makeChart = this.makeChart.bind(this);
      this.makeStats = this.makeStats.bind(this);
      this.displayTradingVolume = this.displayTradingVolume.bind(this);
      this.makeTradingVolChart = this.makeTradingVolChart.bind(this);
      this.makeFailuresChart = this.makeFailuresChart.bind(this);
      this.displayFailures = this.displayFailures.bind(this);
      this.getTransactionDetails = this.getTransactionDetails.bind(this);
      this.makeSwapPieChart = this.makeSwapPieChart.bind(this);
      this.clearCanvases = this.clearCanvases.bind(this);
      this.calculateSwapPieData = this.calculateSwapPieData.bind(this);
      this.calculatePoolPieData = this.calculatePoolPieData.bind(this);
      this.makeSwapBarChart = this.makeSwapBarChart.bind(this);

      this.state = {
        series: [],
        options: {}
      }
    }

    async clearCanvases() {
        const canvasIds = ["gasUsageChart", "gasPriceChart", "tradingVol", 
        "failures", "swaps-pie", "swaps-bar", "pools"];
        for(var idx = 0; idx < canvasIds.length; idx++) {
            const id = canvasIds[idx];
            var height = '175';

            var oldCanvas = document.getElementById(id);
            if(oldCanvas) {
                oldCanvas.remove();
            }

            if(id == "pools" || id == "swaps") {
                height = '300'
            }

            let canvas = document.createElement('canvas');
            canvas.setAttribute('id', id);
            canvas.setAttribute('width','400');
            canvas.setAttribute('height', height);

            document.querySelector("#" + id + "-div").appendChild(canvas);
        }
        const dataDisplay = document.getElementById("data-display")
        dataDisplay.hidden = true;
        const trCtx = document.getElementById("numTrx");
        trCtx.innerText = 0;
    }

    async submitTime () {
        var times = document.getElementsByName('datetime');
        if (times.length !== 2) {
            alert("One of your inputs is invalid. Please try again :)");
        } else {
            await this.clearCanvases();

            const dataDisplay = document.getElementById("data-display")
            dataDisplay.hidden = false;

            const start = new Date(times[0].value);
            const end = new Date(times[1].value);
            const transactions = await this.getTransactions(start, end);

            const trCtx = document.getElementById("numTrx");
            trCtx.innerText = formatNumber(Math.floor(transactions.length));

            const [usageStats, priceStats] = await this.getOrganizedTransactions(transactions);
            var unit = 'hour';
            
            
            await this.makeChart(usageStats[0], 'gasUsageChart', 'Gas Usage', 'scatter', unit, "USAGE");
            await this.makeStats(["maxGas", usageStats[1]], ["minGas", usageStats[2]], ["avgGas", usageStats[3]], "Gas");
            await this.makeChart(priceStats[0], 'gasPriceChart', 'Gas Price', 'scatter', unit, "PRICE");
            await this.makeStats(["maxGasPr", priceStats[1]], ["minGasPr", priceStats[2]], ["avgGasPr", priceStats[3]], "Wei");
            const j = await this.displayTradingVolume(transactions);
            await this.displayFailures(transactions);
            await this.getTransactionDetails(transactions);
        }
    }

    async getTransactions(start, end) {
        return(
            Axios({
                method: "GET",
                url: `${server}getTransactions`,
                headers: {
                "Content-Type": "application/json"
                },
                params: {
                    'start' : start,
                    'end' : end
                }
            }).then(res => {
                return res.data.transactions;
            })
        );
    }

    async getOrganizedTransactions(trx) {
        const trxLength = trx.length;
        var maxTx = null;
        var max = Number.MIN_VALUE;
        var minTx = null;
        var min = Number.MAX_VALUE;
        var avg = 0;

        var maxTxP = null;
        var maxP = Number.MIN_VALUE;
        var minTxP = null;
        var minP = Number.MAX_VALUE;
        var avgP = 0;

        var gasUsage = [];
        var gasPrices = [];

        for (var idx = 0; idx < trxLength; idx++) {
            const tx = trx[idx];
            const time = Number(tx.timeStamp);
            const gas = Number(tx.gasUsed);
            const gasPr = Number(tx.gasPrice);
            
            const theTime = time * 1000;
            
            gasUsage.push({
                x: theTime,
                y: gas
            });
            gasPrices.push({
                x: theTime,
                y: gasPr
            });


            if (gas > max) {
                maxTx = tx;
                max = gas;
            }

            if (gas < min) {
                minTx = tx;
                min = gas;
            }

            avg += gas;
            
            //Gas pricing collection

            if (gasPr > maxP) {
                maxTxP = tx;
                maxP = gasPr;
            }
      
            if (gasPr < minP) {
                minTxP = tx;
                minP = gasPr;
            }
      
            avgP += gasPr;
        }

        avg = avg / trxLength;
        avgP = avgP / trxLength;

        var usageStats = [gasUsage, formatNumber(max), formatNumber(min), formatNumber(avg)];
        var priceStats = [gasPrices, formatNumber(maxP), formatNumber(minP), formatNumber(avgP)];
        return [usageStats, priceStats];
    }

    async makeStats(max, min, avg, unit) {
        var elem = document.getElementById(max[0]);
        elem.innerText = max[1] + " "+ unit;
        elem = document.getElementById(min[0]);
        elem.innerText = min[1] + " "+ unit;
        elem = document.getElementById(avg[0]);
        elem.innerText = avg[1] + " "+ unit;
    }

    async makeChart(data, id, label, graphType, unit, yAxisType) {
        var labelString = "Gas Price in (Wei)"
        if (yAxisType == "USAGE") {
            labelString = "Amount of Gas Used"
        }
         
        var ctx = document.getElementById(id);
        new Chart(ctx, {
            type: graphType,
            data: {
                datasets: [{
                    label: label,
                    data: data
                }]
            },
            options: {
                responsive: true,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: labelString
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: unit,
                            displayFormats: {
                                hour: "MMM DD"
                            },
                            tooltipFormat: "MMM D"
                        },
                        distribution: 'linear',
                        scaleLabel: {
                            display: true,
                            labelString: 'Date/Time'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 20
                        },
                        maxBarThickness: 100,
                    }]
                }
            }
        });
    }

    async displayTradingVolume(trx) {
        var tradeVol = {}
        for (var idx = 0; idx < trx.length; idx++) {
            const tx = trx[idx]

            let day = new Date(Number(tx.timeStamp) * 1000);
            day = Math.floor(day.getTime()/timeFactor);
            if (day in tradeVol) {
                tradeVol[day] = tradeVol[day] + 1;
            } else {
                tradeVol[day] = 1;
            }
        }

        var data = []
        Object.entries(tradeVol).forEach(([key, value]) => {
            data.push({
                x: key * timeFactor, 
                y: value
            })
        });

        const unit = 'day';
        const label = 'Trading Volume';
        await this.makeTradingVolChart('tradingVol', 'bar', label, data, unit)
    }

    async makeTradingVolChart(id, graphType, label, data, unit) {
        var ctx = document.getElementById(id);
        new Chart(ctx, {
            type: graphType,
            data: {
                datasets: [{
                    label: label,
                    data: data
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Number of Transactions'
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: unit
                        },
                        distribution: 'linear',
                        scaleLabel: {
                            display: true,
                            labelString: 'Date/Time'
                        },
                        maxBarThickness: 100
                    }]
                }
            }
        });
    }

    async getTransactionDetails(trx) {
        var swaps = {}
        var pools = {}
        var swapByDay = {}
        const provider = new JsonRpcProvider(
            `https://mainnet.infura.io/v3/${infura}` // If running this example make sure you have a .env file saved in root DIR with INFURA=your_key
        );
        const iface = new Interface(proxyArtifact.abi);
        
        for(var idx = 0; idx < trx.length; idx++) {
            const tx = trx[idx];

            try {
                const txParsed = iface.parseTransaction({ data: tx.input });

                var theSwap = txParsed.functionFragment.name;
                var thePool = txParsed.args.swapSequences[0][0].pool;

                if (theSwap in swaps) {
                    swaps[theSwap] = swaps[theSwap] + 1;
                } else {
                    swaps[theSwap] = 1;
                }

                if (thePool in pools) {
                    pools[thePool] = pools[thePool] + 1;
                } else {
                    pools[thePool] = 1;
                }

                let day = new Date(Number(tx.timeStamp) * 1000);
                day = Math.floor(day.getTime()/timeFactor);

                if (!(day in swapByDay)){
                    swapByDay[day] = {};
                }

                var theDayDict = swapByDay[day];

                if (theSwap in theDayDict) {
                    theDayDict[theSwap] = theDayDict[theSwap] + 1;;
                } else {
                    theDayDict[theSwap] = 1;
                }

                swapByDay[day] = theDayDict;
            } catch (error) {
                console.log("skipped");
            }
        }

        const [labels, data] = await this.calculateSwapPieData(swaps);
        await this.makeSwapPieChart(labels, data, "swaps-pie");
        
        var d = []
        var theSwapKeys = {}

        Object.entries(swapByDay).forEach(([key, value]) => {
            d.push(key * timeFactor);
            Object.entries(value).forEach(([k, v]) => {
                if (!(k in theSwapKeys)) {
                    theSwapKeys[k] = []
                }

                theSwapKeys[k].push(v);
            })
        });

        var swapByDayBreakdown = [d]
        Object.entries(theSwapKeys).forEach(([key, value]) => {
            swapByDayBreakdown.push([key, value]);
        });

        this.makeSwapBarChart('swaps-bar', 'bar', swapByDayBreakdown, 'day');

        //const [labls, dat] = await this.calculatePoolPieData(pools);
        //await this.makePoolPieChart(labls, dat, "pools");

    }

    makeSwapBarChart(id, graphType, data, unit) {
        var the_data = []

        const colors = ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", 
                "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", 
                "#3D9970", "#111111", "#AAAAAA"]
        for(var idx = 1; idx < data.length; idx++) {
            const label = data[idx][0];
            const barData = data[idx][1];
            //console.log(data);
            the_data.push({
                type: 'bar',
                label: label,
                data: barData,
            })

        }

        for(var idx = 0; idx < the_data.length; idx++) {
            the_data[idx]['backgroundColor'] = colors[idx];
        }

        var ctx = document.getElementById(id);
        new Chart(ctx, {
            type: graphType,
            data: {
                labels: data[0],
                datasets: the_data
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        stacked: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Number of Swaps'
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: unit
                        },
                        distribution: 'linear',
                        stacked: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Date/Time'
                        },
                        maxBarThickness: 100
                    }]
                }
            }
        });
    }

    async displayTradingVolume(trx) {
        var tradeVol = {}
        for (var idx = 0; idx < trx.length; idx++) {
            const tx = trx[idx]

            let day = new Date(Number(tx.timeStamp) * 1000);
            day = Math.floor(day.getTime()/timeFactor);
            if (day in tradeVol) {
                tradeVol[day] = tradeVol[day] + 1;
            } else {
                tradeVol[day] = 1;
            }
        }

        var data = []
        Object.entries(tradeVol).forEach(([key, value]) => {
            data.push({
                x: key * timeFactor, 
                y: value
            })
        });

        const unit = 'day';
        const label = 'Trading Volume';
        await this.makeTradingVolChart('tradingVol', 'bar', label, data, unit)
    }

    async calculateSwapPieData(swaps) {
        var labels = [];
        var data =  [];

        Object.entries(swaps).forEach(([key, value]) => {
            labels.push(key);
            data.push(value);
        });
        return [labels, data]
    }

    async makeSwapPieChart(labels, data, id) {

        const ctx = document.getElementById(id);
        new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                label: "Different types of swaps",
                data: data,
                backgroundColor: ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", 
                "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", 
                "#3D9970", "#111111", "#AAAAAA"]
              }]
            },
            options: {
              title: {
                display: true,
                text: 'The Swap Breakdown'
              },
              plugins: {
                pieceLabel: {
                    mode: 'percentage',
                    //fontColor: ['green', 'white', 'red'],
                    precision: 2,
                    position: "outside",
                    arc: true,
                    showActualPercentages: true,
                }
            },
            responsive: true,
            maintainAspectRatio: true,
            }
        });
    }

    async calculatePoolPieData(pools) {
        var labels = [];
        var data =  [];

        Object.entries(pools).forEach(([key, value]) => {
            labels.push(key);
            data.push(value);
        });
        return [labels, data]
    }

    async makePoolPieChart(labels, data, id) {
        var bg_color = [];
        for(var idx = 0; idx < labels.length; idx++) {
            const randomColor = Math.floor(Math.random()*16777215).toString(16);
            bg_color.push("#" + randomColor);
        }

        const ctx = document.getElementById(id);
        new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                label: "Different types of Pools",
                data: data,
                backgroundColor: bg_color
              }]
            },
            options: {
              title: {
                display: true,
                text: 'The Pool Breakdown'
              }
            }
        });
    }

    async displayFailures(trx) {
        var times = {};
        var failures = 0;
        var passes = 0;
        
        for (var idx = 0; idx < trx.length; idx++) {
            const tx = trx[idx]

            var contractExec = Number(tx.isError);
            var transactionExec = Number(tx.txreceipt_status);

            let contractExecFail = false;
            let transactionExecFail = false;

            if (contractExec == 1) {
                contractExecFail = true;
            } else if (transactionExec == 0) {
                transactionExecFail = true;
            }

            if(contractExec == 0 && transactionExec == 1){
                passes++;
            } else {
                failures++;
            }

            let day = new Date(Number(tx.timeStamp) * 1000);
            day = Math.floor(day.getTime()/timeFactor);

            //Check if day is present
            if (!(day in times)) {
                times[day] = {
                    'contract' : 0,
                    'transaction' : 0
                }
            } 
            
            if (contractExecFail) {
                times[day]['contract'] = times[day]['contract'] + 1;
            } else if (transactionExecFail) {
                times[day]['transaction'] = times[day]['transaction'] + 1;
            }

            times[day] = times[day];
        }

        var d = []
        var cFails = []
        var tFails = []

        Object.entries(times).forEach(([key, value]) => {
            d.push(key * timeFactor);
            Object.entries(value).forEach(([k, v]) => {
                if (k == 'contract') {
                    cFails.push(v);
                } else {
                    tFails.push(v);
                }
            })
        });

        const id = "failures";
        const labels = ['Contract Execution Error', 'Transaction Receipt Error'];
        const data = [d, cFails, tFails];
        const unit = 'day';
        this.makeFailuresChart(id, 'bar', labels, data, unit);
    }

    makeFailuresChart(id, graphType, labels, data, unit) {
        var ctx = document.getElementById(id);
        new Chart(ctx, {
            type: graphType,
            data: {
                labels: data[0],
                datasets: [{
                    type: 'bar',
                    label: labels[0],
                    data: data[1],
                    backgroundColor: "red"
                }, {   
                    type: 'bar',
                    label: labels[1],
                    data: data[2],
                    backgroundColor: "blue"
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        stacked: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Number of Failures'
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: unit
                        },
                        distribution: 'linear',
                        stacked: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Date/Time'
                        },
                        maxBarThickness: 100
                    }]
                }
            }
        });
    }

    render() {
    return (
        <div>
            <div id="welcome-message">
                <h4>
                    Welcome to the Balancer Labs Analytics Dashboard!
                    <br></br>
                    Please be mindful and patient when querying for large date ranges (3+ weeks)
                </h4>
            </div>
            <div className = "bar" style={{"display": "flex", 
                "justify-content": "space-around", "align":"center", "margin" : "0 auto"}}>
                <StartDate/>
                <EndDate/>
                <button onClick={this.submitTime} style={{"height": "30px", "margin-top" : "50px"}}>
                    Submit
                </button>
            </div>
            <div id="data-display" hidden>
                <div style={{"display": "flex", 
                "justifyContent": "space-around", "alignItems":"center", "margin" : "0 auto"}}>
                    <h1>Total Number of Transactions:     </h1>
                    <h1 id="numTrx"> <b> ~~~ </b> </h1>
                </div>
                <div>
                    <h3>Gas Usages</h3>
                    <div id="gasUsageChart-div">
                        <canvas id="gasUsageChart" width="400" height="100"></canvas>
                    </div>
                    <GasUsageStatsBar/>
                    <hr noshade></hr>
                </div>
                <div>
                    <h3>Gas Prices</h3>
                    <div id="gasPriceChart-div">
                        <canvas id="gasPriceChart" width="400" height="100"></canvas>
                    </div>
                    <GasPriceStatsBar/>
                    <hr noshade></hr>
                </div>

                <div>
                    <h3>Number of Swaps Per Day</h3>
                    <div id="tradingVol-div">
                        <canvas id="tradingVol" width="400" height="100"></canvas>
                    </div>
                    <hr noshade></hr>
                </div>
                
                <div>
                    <h3>Failures</h3>
                    <div id="failures-div">
                        <canvas id="failures" width="400" height="100"></canvas>
                    </div>
                    <hr noshade></hr>
                </div>

                <div>
                    <h3>Swap Breakdown</h3>
                    <div id="swaps-pie-div">
                        <canvas id="swaps-pie" width="400" height="100"></canvas>
                    </div>
                    <div id="swaps-bar-div">
                        <canvas id="swaps-bar" width="400" height="100"></canvas>
                    </div>
                    <hr noshade hidden></hr>
                </div>

                <div id="pools-section-div" hidden>
                    <h3>Pool Breakdown</h3>
                    <div id="pools-div">
                        <canvas id="pools" width="400" height="100"></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
    }
}