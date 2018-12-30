import * as actionTypes from '../actions/actionTypes';

const initialState = {
    emails: [],
    currentPage: 0, 
    count: 0,
    loading: false    
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.FETCH_EMAILS_START:
            return { ...state, loading: true }
        case actionTypes.FETCH_EMAILS_SUCCESS:
            return { ...state, loading: false, emails: action.emails, count: action.count }
        case actionTypes.FETCH_EMAILS_FAIL:
            return { ...state, loading: false }
        case actionTypes.EMAILS_PAGE_CHANGE:
            return { ...state, currentPage: action.pageNumber}    
        default:
            return state;    
    }
}
export default reducer;