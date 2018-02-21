import React, { Component } from 'react';

import './style.css'

import EntityCard from '../../../../components/EntityCard/';

class ConnectionsTab extends Component {

  render(){
    return(
      <div className="tab">
        <h3><u>Connections</u></h3>
        {this.props.nodeRelationships.map((tuple) => {
          return(
            <div className="connectionCard">
              <div className="connectionType">
                <div>{"Is " + tuple[0].type + ": "}</div>
                </div>
                <EntityCard nodeItem={tuple[1]}/>
              <hr></hr>
            </div>
          );
        })}
      </div>
    );
  }
}

export default ConnectionsTab;