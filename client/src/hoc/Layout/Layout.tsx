import React, {Component} from 'react';
import Toolbar from '../../components/Navigation/Toolbar/Toolbar';
import SideDrawer from '../../components/Navigation/SideDrawer/SideDrawer';



class Layout extends Component {

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

    render(){
        return (
            <>
                <Toolbar drawerToggleClicked={this.drawerToggleClickedHandler} />
                <SideDrawer mobileOpen={this.state.mobileOpen} />
                {this.props.children}
            </>
        );
    }
}



export default Layout;