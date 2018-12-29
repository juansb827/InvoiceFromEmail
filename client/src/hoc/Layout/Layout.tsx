import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import { withStyles } from '@material-ui/core/styles';

import Toolbar from '../../components/Navigation/Toolbar/Toolbar';
import SideDrawer from '../../components/Navigation/SideDrawer/SideDrawer';

const styles = theme => ({
  root: {
    display: 'flex',
  },   
  toolbar: theme.mixins.toolbar,  
  content: {
    flex: '1',
    width: '0px',
    padding: theme.spacing.unit * 3,
  },
});


interface Props {    
    classes: any;
    theme: any;
    
}  

class Layout extends React.Component<Props> {

    state = {
        mobileOpen: false
    }
    sideDrawerClosedHandler = () =>{
        this.setState({showSideDrawer: false});
    }

    drawerToggleClickedHandler = () =>{
        this.setState( (prevState: any)  => {
            return {mobileOpen: !prevState.mobileOpen}
        } );
    }

    render() {
        const { classes } = this.props;
    
       
        return (
          <div className={classes.root}>
            <CssBaseline />
            <Toolbar title='Invoice Processor' drawerToggleClicked={this.drawerToggleClickedHandler}/>
            <SideDrawer mobileOpen={this.state.mobileOpen} 
            closed={this.drawerToggleClickedHandler}/>
            <main className={classes.content}>
              <div className={classes.toolbar} />
              {this.props.children}
            </main>
          </div>
        );
      }
}



export default withStyles(styles, { withTheme: true })(Layout);