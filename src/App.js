import logo from './logo.svg';
import './App.css';
import Axios from "axios";
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import { Route} from 'react-router-dom';
import Gas from './components/gas.component';

function App() {
  Axios({
    method: "GET",
    url: "http://localhost:3000/",
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => {
    console.log(res.data.message);
  });
  //<Route>
  //component={Login}
  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Switch>
              <Route exact path='/' component ={Gas}/>
            </Switch>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
