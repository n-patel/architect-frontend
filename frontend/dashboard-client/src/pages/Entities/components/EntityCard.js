/* DEPRECATED 02/22/2018 IN ENTITIES PAGE PR

import React, {Component} from 'react';
import './style.css'

import RaisedButton from 'material-ui/RaisedButton';
import Person from 'material-ui/svg-icons/social/person';
import Entity from 'material-ui/svg-icons/social/domain';
import Location from 'material-ui/svg-icons/communication/location-on';
import Nationality from 'material-ui/svg-icons/content/flag';
import Document from 'material-ui/svg-icons/av/note';
import {Link} from 'react-router-dom';

class EntityCard extends Component {

    constructor(props) {
        super(props);
        this.renderSourceLink = this.renderSourceLink.bind(this);
    }

    renderIcon(entity) {
        if (entity.type.toLowerCase() === "person") {
          return <Person className="icon"/>
        }
        if ( entity.type.toLowerCase() === "document") {
          return <Document className="icon"/>
        }
        if (entity.type.toLowerCase() ==="organization" || entity.type.toLowerCase() === "company") {
          return <Entity className="icon"/>
        }
        if (entity.type.toLowerCase() === "location") {
          return <Location className="icon"/>
        }
        if (entity.type.toLowerCase() === "nationality") {
          return <Nationality className="icon"/>
        }
    }
    
    renderSourceLink(vertex, getSource) {
        var docText = getSource(vertex);
        var docText15words;
        if (typeof(docText) === "undefined") {
          docText15words = "";
        } else {
          docText15words = docText.replace(/(([^\s]+\s\s*){15})(.*)/,"$1…");
        }
        return (
            <div>
              <span className="type"><Link replace to={"/source/"+vertex.entity.sources}><b>Source:</b></Link>{" " +docText15words}</span>
            </div>
        );
    }
  render() {
    /*if (this.props.listType === "suggested_entities") {
      return (
        <div className="entityCard" onClick={() => this.props.onEntityClick(this.props.entity)}>
            <div className="cardHeader">
                {this.renderIcon(this.props.entity)}
                <div className="cardHeaderText">
                    <span className="title"> {this.props.entity.qid && this.props.entity.qid.charAt(0) !== "T" ? <a href={"https://www.wikidata.org/wiki/" + this.props.entity.qid}>{this.props.entity.name} </a> : this.props.entity.name}</span>
                    <span className="type">{this.props.entity.type}</span>
                    <RaisedButton label="Create Entity" onClick={()=>this.props.onCreateEntity(this.props.entity)} />
                    <RaisedButton label="Delete" onClick={()=>this.props.onDeleteEntity(this.props.entity)} />
                </div>
            </div>
            <div className="cardBody">
                {this.renderSourceLink(this.props.entity, this.props.getSource)}
            </div>
        </div>
    );
    }
    else {
      return (
          <div className="entityCard" onClick={() => this.props.onEntityClick(this.props.entity)}>
              <div className="cardHeader">
                  {this.renderIcon(this.props.entity)}
                  <div className="cardHeaderText">
                      <span className="title"> {this.props.entity.qid && this.props.entity.qid.charAt(0) !== "T" ? <a href={"https://www.wikidata.org/wiki/" + this.props.entity.qid}>{this.props.entity.name} </a> : this.props.entity.name}</span>
                      <span className="type">{this.props.entity.type}</span>
                      <RaisedButton label="Delete" onClick={()=>this.props.onDeleteEntity(this.props.entity)} />
                  </div>
              </div>
              <div className="cardBody">
                  {this.renderSourceLink(this.props.entity, this.props.getSource)}
              </div>
          </div>
      );
    /*}
  }
}

export default EntityCard;
*/