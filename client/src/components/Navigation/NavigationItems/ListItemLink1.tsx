import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

interface Props {
    to: string;
    icon: any;
    primary: any;
}
class ListItemLink1 extends React.Component<Props> {
    renderLink = itemProps => <Link to={this.props.to} {...itemProps} />;
  
    render() {
      const { icon, primary } = this.props;
      return (
        <li>
          <ListItem button component={this.renderLink}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={primary} />
          </ListItem>
        </li>
      );
    }
  }

export default ListItemLink1;
  