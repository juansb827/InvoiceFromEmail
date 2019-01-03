import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import emailReducer from './store/reducers/email';
import itemReducer from './store/reducers/item';
import itemTypes from './store/itemTypes';

const composeEnhancers = (process.env.NODE_ENV === 'development' ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : null) || compose;
const rootReducer = combineReducers({
//    email: emailReducer,
    [itemTypes.EMAIL] : itemReducer(itemTypes.EMAIL),
    [itemTypes.INVOICE] : itemReducer(itemTypes.INVOICE),
    [itemTypes.INVOICE_ITEMS] : itemReducer(itemTypes.INVOICE_ITEMS)  
});

const store = createStore(rootReducer, composeEnhancers(
    applyMiddleware(thunk)
));


ReactDOM.render(
    <Provider store={store} >
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>
, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA

serviceWorker.unregister();
