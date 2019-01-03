import * as actionTypes from './actionTypes';
import * as api from '../../api/api';

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
        api.getEmails({ pageNumber, rowsPerPage: pageSize })
        .then(res => dispatch(fetchEmailSuccess(res.data, res.count)))
        
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
