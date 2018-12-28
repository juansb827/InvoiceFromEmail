import React from "react";

import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";

import MailIcon from "@material-ui/icons/Mail";
import ListIcon from "@material-ui/icons/ListAlt";
import SettingsIcon from "@material-ui/icons/Settings";
import ListItemLink1 from './ListItemLink1';


const navigationItems: React.StatelessComponent<{}> = props => {
  return (
    <>
      <Divider />
      <List>
        <ListItemLink1 to="/emails" primary="Emails" icon={<MailIcon />} />
        <ListItemLink1 to="/invoices" primary="Facturas" icon={<ListIcon />} />
      </List>
      <Divider />
      <List>
        <ListItemLink1 to="/settings" primary="Configuración" icon={<SettingsIcon />} />        
      </List>
      
    </>
  );
};

export default navigationItems;
