import React from 'react';
import Table from '../UI/Table/Table';

let id = 0;
function createData(name, calories, fat, carbs, protein) {
  id += 1;
  return { id, name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9)
];

const rows2 = [
   
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
]



const emails = class extends React.Component {

    state = {
        rows: []   
    }
    onPageChangeHandler = (event, page) => {
        console.log(page);
        setTimeout(()=>{
            this.setState({
                rows: page == 1 ? rows: rows2
            })
        }, 2000)
        
    }
    render(){ 
        return (
            <div>Emails Component
                <Table 
                    title='Emails'
                    rows={this.state.rows}                
                    onPageChange={this.onPageChangeHandler} />
            </div>
        )
    } 
  
}

export default emails;