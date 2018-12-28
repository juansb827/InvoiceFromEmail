import React, { Component } from "react";
import Layout from "./hoc/Layout/Layout";
import { Route, Switch, Redirect } from "react-router-dom";

import Emails from './containers/Emails/Emails';
import Invoices from './containers/Invoices/Invoices';

import "./App.css";



class App extends Component {

  render() {
    
    return (
      <div>
        <Layout>
          <Switch>
            <Route path="/emails" component={Emails} />
            <Route path="/invoices" component={Invoices} />
            <Redirect to="/emails" />
          </Switch>
        </Layout>
      </div>
    );
  }

}

export default App;
