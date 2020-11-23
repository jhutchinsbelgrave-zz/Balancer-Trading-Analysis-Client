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
        { minimumFractionDigits: 2 }
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

      this.state = {
        series: [],
        options: {}
      }
    }

    async clearCanvases() {
        const canvasIds = ["gasUsageChart", "gasPriceChart", "tradingVol", "failures", "swaps", "pools"];
        for(var idx = 0; idx < canvasIds.length; idx++) {
            var canvas = document.getElementById(canvasIds[idx]);
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        const trCtx = document.getElementById("numTrx");
        trCtx.innerText = 0;
    }

    async submitTime () {
        var times = document.getElementsByName('datetime');
        if (times.length !== 2) {
            alert("One of your inputs is invalid. Please try again :)");
        } else {
            await this.clearCanvases();
            const start = new Date(times[0].value);
            const end = new Date(times[1].value);
            const transactions = await this.getTransactions(start, end);
            console.log(transactions[0]);

            const trCtx = document.getElementById("numTrx");
            trCtx.innerText = formatNumber(transactions.length);

            const [usageStats, priceStats] = await this.getOrganizedTransactions(transactions);
            var unit = 'hour';
            
            
            await this.makeChart(usageStats[0], 'gasUsageChart', 'Gas Usage', 'line', unit, "USAGE");
            await this.makeStats(["maxGas", usageStats[1]], ["minGas", usageStats[2]], ["avgGas", usageStats[3]], "Gas");
            await this.makeChart(priceStats[0], 'gasPriceChart', 'Gas Price', 'line', unit, "PRICE");
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
                        }
                        
                    }]
                }
            }
        });
    }

    async displayTradingVolume(trx) {
        var tradeVol = {}
        console.log("Starting trade Count");
        for (var idx = 0; idx < trx.length; idx++) {
            const tx = trx[idx]

            let day = new Date(Number(tx.timeStamp) * 1000);
            day = Math.floor(day.getTime()/timeFactor);
            console.log(day);
            if (day in tradeVol) {
                tradeVol[day] = tradeVol[day] + 1;
            } else {
                tradeVol[day] = 1;
            }
        }

        console.log("Starting data");
        var data = []
        Object.entries(tradeVol).forEach(([key, value]) => {
            data.push({
                x: key * timeFactor, 
                y: value
            })
        });

        console.log(data);

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
                        }
                    }]
                }
            }
        });
    }

    async getTransactionDetails(trx) {
        var swaps = {}
        var pools = {}
        for(var idx = 0; idx < trx.length; idx++) {
            const txTemp = trx[idx];
            const txHash = txTemp.hash;

            console.log(`getTransactionDetails: ${txHash}`);
        
            const provider = new JsonRpcProvider(
                `https://mainnet.infura.io/v3/${infura}` // If running this example make sure you have a .env file saved in root DIR with INFURA=your_key
            );
            
            //"0x3ca9184e00000000000000000000000000000000000000000000000000000000000000800000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c5990000000000000000000000000000000000000000000000000000000003416de70000000000000000000000000000000000000000000000010194bbba285be00000000000000000000000000000000000000000000000000000000000000000010000000000000000000000001eff8af5d577060ba4ac8a29a13525bb0ee2a3d50000000000000000000000000000000000000000000000000000000003416de70000000000000000000000000000000000000000000000010194bbba285be000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            let tx = await provider.getTransaction(txHash);
            console.log("The transaction")
            console.log(tx);      // Have a look at this to get familiar with what it shows
        
            const iface = new Interface(proxyArtifact.abi);

            try {
                const txParsed = iface.parseTransaction({ data: tx.data });
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

                console.log(txParsed);
                console.log(txParsed.args.swapSequences);       // Start looking at parsing the pools used from this. Some will have a single pool others will have multipool so check both work ok.
                console.log(txParsed.args.swapSequences[0][0]);
                console.log(theSwap);    // i.e. multihopBatchSwapExactOut
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            } catch (error) {
                console.log("skipped");
            }
            
        }

        const [labels, data] = await this.calculateSwapPieData(swaps);
        console.log(labels);
        console.log(data);
        await this.makeSwapPieChart(labels, data, "swaps");
        const [labls, dat] = await this.calculatePoolPieData(pools);
        console.log(labls);
        console.log(dat);
        await this.makePoolPieChart(labls, dat, "pools");

    }

    async calculateSwapPieData(swaps) {
        var labels = [];
        var data =  [];

        Object.entries(swaps).forEach(([key, value]) => {
            labels.push(key);
            data.push(value);
        });
        console.log(labels);
        console.log(data);
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
                    datalabels: {
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => {
                                sum += data;
                            });
                            let percentage = (value*100 / sum).toFixed(2)+"%";
                            return percentage;
                        },
                        color: '#fff',
                    }
                }
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

        const ctx = document.getElementById(id);
        new Chart(ctx, {
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                label: "Different types of Pools",
                data: data,
                backgroundColor: ["#0074D9", "#FF4136", "#2ECC40", "#FF851B", "#7FDBFF", "#B10DC9", 
                "#FFDC00", "#001f3f", "#39CCCC", "#01FF70", "#85144b", "#F012BE", 
                "#3D9970", "#111111", "#AAAAAA"]
              }]
            },
            options: {
              title: {
                display: true,
                text: 'The Pool Breakdown'
              },
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => {
                                sum += data;
                            });
                            let percentage = (value*100 / sum).toFixed(2)+"%";
                            return percentage;
                        },
                        color: '#fff',
                    }
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
            console.log(day);

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
                        }
                    }]
                }
            }
        });
    }

    render() {
    return (
        <div>
            <div className = "bar" style={{"display": "flex", 
                "justify-content": "space-around", "align":"center", "margin" : "0 auto"}}>
                <StartDate/>
                <EndDate/>
                <button onClick={this.submitTime} style={{"height": "30px", "margin-top" : "50px"}}>
                    Submit
                </button>
            </div>
            <div>
                <h1>Total Number of Transactions</h1>
                <p id="numTrx"> ~~~ </p>
            </div>
            <div>
                <canvas id="gasUsageChart" width="400" height="100"></canvas>
                <GasUsageStatsBar/>
            </div>
            <div>
                <canvas id="gasPriceChart" width="400" height="100"></canvas>
                <GasPriceStatsBar/>
            </div>

            <div>
                <canvas id="tradingVol" width="400" height="100"></canvas>
            </div>
            
            <div>
                <canvas id="failures" width="400" height="100"></canvas>
            </div>

            <div>
                <canvas id="swaps" width="400" height="100"></canvas>
            </div>

            <div>
                <canvas id="pools" width="400" height="100"></canvas>
            </div>
        </div>
    );
    }
}

//<EndDate/>