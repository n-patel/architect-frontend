import React, { Component } from 'react';
//import '../App.css';
import './SourcePage.css';

import AddEntity from './AddEntity.js'
import EntityList from './EntityList.js'
import NodeGraph from './NodeGraph.js'
import Source from './Source.js'

import Paper from 'material-ui/Paper';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../actions/';
import * as server from '../../server/';


class SourcePage extends Component {

  constructor(props) {
    super(props);
    var sourceid=this.props.match.params.id
    this.state = {
      entities: this.props.savedEntities.entities,
      source: this.props.savedSources.notes.find((note) => {return note._id === sourceid}),
    }
    //this.getEntities = this.getEntities.bind(this)
  }

  componentWillMount = () => {
        server.loadEntities()
            .then((data) => {
                this.props.dispatch(actions.addEntities(data.entities))
                
                this.props.dispatch(actions.addSources(data.notes))
        }).catch((err) => console.log(err))
    }

  /*componentWillReceiveProps(nextProps) {
    this.setState({
      entities: nextProps.savedEntities.entities
    })
  }*/

  /*getEntities() {
    var sourceid = this.state.sourceid
    var entities = this.state.entities.filter(function (obj) {return obj.sources[0]=== sourceid})
    
    if (typeof(entities)==="undefined") {
      return []
    }
    else {return entities}
  }*/

  render() {
    return (
      <div>  
        <div className="centered">
          <div id="summary">      
            <h1 id="hello"> Hong Kong Internet (Holding) Unlimited Document #1 </h1>
          </div>
          <AddEntity className="addentity"/>
        </div>
        <div className="document-entities">
          <div className="left-column">
            <Source />
          </div>
          <div className="middle-column">
            <EntityList entities={this.props.sourceEntities}/>
          </div>

          <div className="right-column">
            <Paper>
              <NodeGraph entities={this.props.sourceEntities} sources={this.props.savedSources.notes}/>
            </Paper>
          </div>
        </div>
      </div>
    );
  }
}
 
function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(actions, dispatch),
        dispatch: dispatch,
    };
}

function mapStateToProps(state, props) {
    debugger
    var sourceid = props.match.params.id
    return {
        savedEntities: state.data.savedEntities,
        savedSources: state.data.savedSources,
        sourceEntities: state.data.savedEntities.entities.filter(function (obj) {return obj.sources[0]=== sourceid})
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SourcePage)