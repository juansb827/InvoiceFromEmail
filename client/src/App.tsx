import React, { Component } from "react";
import Layout from "./hoc/Layout/Layout";

import { withStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import deepOrange from "@material-ui/core/colors/deepOrange";
import deepPurple from "@material-ui/core/colors/deepPurple";
import Grid from "@material-ui/core/Grid";

import "./App.css";

const styles = {
  avatar: {
    margin: 10
  },
  orangeAvatar: {
    margin: 10,
    color: "#fff",
    backgroundColor: deepOrange[500]
  },
  purpleAvatar: {
    margin: 10,
    color: "#fff",
    backgroundColor: deepPurple[500]
  }
};

class Props {
  classes: any;
}

class App extends Component<Props> {
  render() {
    const { classes } = this.props;
    return (
      <div>
        <Layout>
          <Grid container justify="center" alignItems="center">
            <Avatar className={classes.avatar}>H</Avatar>
            <Avatar className={classes.orangeAvatar}>N</Avatar>
            <Avatar className={classes.purpleAvatar}>OP</Avatar>
          </Grid>
        </Layout>
      </div>
    );
  }
}

/*App.propTypes = {
  classes: App.object.isRequired,
}; */

export default withStyles(styles)(App);
