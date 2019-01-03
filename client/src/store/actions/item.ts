import * as actionTypes from './actionTypes';


/*
export const initItemsConf = (name: string, rowsPerPage: number) => {
    return {
        type: `${name}_`+actionTypes.ITEMS_INIT,
        rowsPerPage
    }
}*/
export const selectItem = (name: string, selectedItem: any) => {
    return {
        type: `${name}_`+actionTypes.SELECT_ITEM,
        selectedItem
    }
}



export const fetchItemsSuccess = (items: Array<any>, count: number, name: string) => {
    return {
        type: `${name}_`+actionTypes.FETCH_ITEMS_SUCCESS,
        items,
        count
    }
}

export const fetchItemsFail = (error, name: string) => {
    return {
        type: `${name}_`+actionTypes.FETCH_ITEMS_FAIL,
        error: error
    }
}

export const fetchItemsStart  = (name: string) => {
    return {
        type: `${name}_`+actionTypes.FETCH_ITEMS_START
    }
}

export const fetchItems = (name: string, fetchFn: Promise<any>
    ) => {    
    return (dispatch,) => {                
        dispatch(fetchItemsStart(name));        
        fetchFn
        .then(res => {                                  
            dispatch(fetchItemsSuccess(res.data, res.count, name))
        })
        .catch(err => {
            dispatch(fetchItemsFail(err, name));
        }) 
    }
}

export const changeItemsPage = (name: string, pageNumber: number, rowsPerPage: number, fetchFn?) => {
    return dispatch => {
        dispatch({ type: `${name}_`+actionTypes.ITEMS_PAGE_CHANGE, pageNumber});
        dispatch(fetchItems(name, fetchFn));
    }
}
