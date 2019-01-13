import React, { Component } from "react";
import Dialog from "../components/UI/Dialog/Dialog";


const withErrorHandler = (WrappedComponent, axios) => {
  return class extends Component {
    reqInterceptor: any;
    resInterceptor: any;
    state = {
      error: null,      
    };

    componentWillMount() {
      this.reqInterceptor = axios.interceptors.request.use(request => {
        this.setState({ error: null });
        return request;
      });

      this.resInterceptor = axios.interceptors.response.use(
        res => {
            console.log('RES', res);
            return res;
        },
        error => {
          let parsedError = null;
          if (error.response)  {
            const res = error.response.data;  
            parsedError = {
                status: error.response.status,
                name: res.error && res.error.name || 'Error',
                message: res.error && res.error.message || 'Error procesando solicitud'        
            }                
          }
          else{
                parsedError = {
                    message: error.message
                }                                     
          }                        
         this.setState({ error: parsedError })                    
          return Promise.reject(error);
        }
      ); 
    }

    componentWillUnmount() {
      axios.interceptors.request.eject(this.reqInterceptor);
      axios.interceptors.response.eject(this.resInterceptor);
    }

    errorConfirmedHandler = () => {
      this.setState({ error: null });
    };

    render() {
      const { error }   = this.state;
      return (
        <>
          <Dialog
            open={!!this.state.error}
            onClose={this.errorConfirmedHandler} >
            {error && <div>Error<br/>{error.message}</div>}
            
          </Dialog>
          <WrappedComponent {...this.props} />
        </>
      );
    }
  };
};

export default withErrorHandler;