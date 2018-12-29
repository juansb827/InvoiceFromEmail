import React from 'react';
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

const toolbarStyles = theme => ({
    root: {
      paddingRight: theme.spacing.unit,
    },
    spacer: {
      flex: '1 1 100%',
    },
    actions: {
      color: theme.palette.text.secondary,
    },
    title: {
      flex: '0 0 auto',
    },
  });
  
  interface Props {
    title: string;
    classes: any;
  }

  const TableToolbar: React.StatelessComponent<Props> = props => {
    const {  classes, title } = props;
  
    return (
      <Toolbar
        className={classes.root}  >
        <div className={classes.title}>        
            <Typography variant="h6" id="tableTitle">
                {title}
            </Typography>
        </div>
      </Toolbar>
    );
  };
  
  
  
export default withStyles(toolbarStyles)(TableToolbar);
  