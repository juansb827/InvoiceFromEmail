import * as actionTypes from './actionTypes';
import axios from '../../axios-instance';


export const fetchEmailSuccess = (emails, count: number) => {
    return {
        type: actionTypes.FETCH_EMAILS_SUCCESS,
        emails,
        count
    }
}

export const fetchEmailsFail = (error) => {
    return {
        type: actionTypes.FETCH_EMAILS_FAIL,
        error: error
    }
}

export const fetchEmailsStart  = () => {
    return {
        type: actionTypes.FETCH_EMAILS_START
    }
}

export const fetchEmails = (pageNumber: number, pageSize: number) => {    
    return dispatch => {        
        dispatch(fetchEmailsStart());
        axios.get('/emails', {
            params: {
                page_number: pageNumber,
                page_size: pageSize
            }
        }).then(res => {
            console.log('DATA', res);
            const count = +res.headers['pagination-count'];
            dispatch(fetchEmailSuccess(res.data, count))
        })
        .catch(err => {
            dispatch(fetchEmailsFail(err));
        }) 
    }
}

export const changePage = (pageNumber: number) => {
    return dispatch => {
        dispatch({ type: actionTypes.EMAILS_PAGE_CHANGE, pageNumber});
        dispatch(fetchEmails(pageNumber, 10));
    }
}
