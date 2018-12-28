import React from "react";

import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";

const drawerWidth = 240;
const styles = theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    marginLeft: drawerWidth,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  menuButton: {
    marginRight: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
  },
});

interface Props {
  title: string;
  classes: any;
  drawerToggleClicked: any;
}

const toolbar: React.StatelessComponent<Props> = props => {
  const { classes } = props;

  return (
    <AppBar position="fixed" className={classes.appBar}>  
      <Toolbar>
        <IconButton
          className={classes.menuButton}
          onClick={props.drawerToggleClicked}
          color="inherit"
          aria-label="Menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" color="inherit" noWrap>
          {props.title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default withStyles(styles, { withTheme: true })(toolbar);
