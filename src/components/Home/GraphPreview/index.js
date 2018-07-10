import React, {Component} from "react";
import { Link } from "react-router-dom";
import Graph from '../../Canvas/Graph/'
import ArcherGraph from "../../Canvas/Graph/package/GraphClass";
import * as server from '../../../server/'
import * as homeActions from '../../../redux/actions/homeActions';

import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import {loadData} from "../../../redux/actions/graphActions"

import './style.css';

class GraphPreview extends Component {

    constructor(props) {
      super(props);
      this.graph = new ArcherGraph();
    }

    componentDidMount() {
      server.searchBackendText("Dan Gertler") // hardcoded for now, don't worry too much about it until we decide this way of doing the narratives is conceptually best
        .then((data) => {
          let neo4j_id = data[0].id;
          this.props.dispatch(homeActions.addToVignetteFromId(this.graph, neo4j_id, this.props.index));
        })
        .catch((err)=> {console.log(err)});
    }

    loadDataToMainGraph = () => {
        this.props.dispatch(loadData(this.props.vignetteGraphData[this.props.index]))
    };

    render() {
        return (
          <div className="graph-preview">
            <div className="graph-card">
              <Graph graph={this.graph} height={400} width={540} displayMinimap={false} allowKeycodes={false} data={this.props.vignetteGraphData[this.props.index]}/>
            </div>
            <div className="graph-preview-footer flex-row">
              <div className="graph-preview-share-icons">
                <i className="graph-preview-action twitter-action fab fa-twitter"></i>
                <i className="graph-preview-action link-action fas fa-link"></i>
              </div>
              <Link to="/explore">
                  <button className="btn btn-primary graph-preview-explore-button ml-auto" onClick={() => this.loadDataToMainGraph()}>
                      Explore In Depth
                      <i className="explore-icon material-icons">launch</i>
                  </button>
              </Link>
            </div>
          </div>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return {
        dispatch: dispatch,
    };
}

function mapStateToProps(state) {
    return {
        vignetteGraphData: state.home.vignetteGraphData
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GraphPreview));
