import * as actionTypes from '../actions/actionTypes';

const initialState = {
    items: [],
    currentPage: 0, 
    count: 0,
    loading: false,        
    endpoint: null,
    selectedItem: null, 
    rowsPerPage: 0
};



const createNamedItemReducer = (name  ) => {    
    const reducer = (state = initialState, action) => {
        switch (action.type) {
            case `${name}_`+actionTypes.FETCH_ITEMS_START:
                return { ...state,
                    items: [], 
                    loading: true }
            case `${name}_`+actionTypes.FETCH_ITEMS_SUCCESS:
                return { ...state, loading: false, items: action.items, count: action.count }
            case `${name}_`+actionTypes.FETCH_ITEMS_FAIL:
                return { ...state, loading: false }
            case `${name}_`+actionTypes.ITEMS_PAGE_CHANGE:
                return { ...state, currentPage: action.pageNumber}                                   
            case `${name}_`+actionTypes.SELECT_ITEM:
                return { ...state, 
                    selectedItem: action.selectedItem                    
                }                                                   
            default:
                return state;    
        }
    }
    return reducer;
}
export default createNamedItemReducer;


