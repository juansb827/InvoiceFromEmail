import React from 'react';
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import CircularProgress from '@material-ui/core/CircularProgress';
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
    progress: {
      margin: theme.spacing.unit * 2      
    },
    invisible: {
      opacity: 0
    }
  });
  
  interface Props {
    title: string;
    classes: any;
    loading: boolean;
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
        <CircularProgress className={
          [classes.progress, 
           props.loading ? '': classes.invisible ].join(' ')}  />
      </Toolbar>
    );
  };
  
  
  
export default withStyles(toolbarStyles)(TableToolbar);
  