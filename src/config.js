require('dotenv').config();

console.log("The INFURA");
console.log(process.env.REACT_APP_INFURA);
console.log(process.env);

module.exports = {
  infura: process.env.REACT_APP_INFURA
};