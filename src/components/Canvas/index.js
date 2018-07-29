import React, {Component} from "react";
import Graph from "./Graph";
import ArcherGraph from "./Graph/package/GraphClass";
import GraphSidebar from "./graphSidebar";
import SideNavBar from "../sideNavBar";
import PublishButton from "./publishButton";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import {fetchSearchResults} from "../../redux/actions/graphActions";
import {clearCurrentEntity} from "../../redux/actions/graphSidebarActions";

import './style.css';

class Canvas extends Component {

    constructor(props) {
        super(props);
        this.graph = new ArcherGraph();
        this.baseUrl = '/explore';
    }

    componentDidMount() {
        // if (this.props.currentNode != null) {
        //   debugger;
        //     this.props.history.push(this.baseUrl + '/entity/' + encodeURIComponent(this.props.currentNode.id))
        // }
        if (this.props.match.params && this.props.match.params.sidebarState === 'search' && this.props.match.params.query != null) {
            this.props.dispatch(fetchSearchResults(this.props.match.params.query));
        } else if (this.props.match.params && this.props.match.params.sidebarState === 'entity') {
            // this.props.dispatch(fetchEntity(decodeURIComponent(this.props.match.params.query)));
        }
    }

    componentWillReceiveProps(nextprops) {
        if (nextprops.currentNode != null && this.props.currentNode !== nextprops.currentNode) {
            this.props.history.push(this.baseUrl + '/entity/' + encodeURIComponent(nextprops.currentNode.id))
        }
        if (this.props.location.pathname !== nextprops.location.pathname && nextprops.match.params) {
            let nextQuery = nextprops.match.params.query;
            if (nextprops.match.params.sidebarState === 'search') {
                if (nextQuery != null && this.props.match.params.query !== nextQuery) {
                    this.props.dispatch(fetchSearchResults(nextQuery));
                }
            } else if (nextprops.match.params.sidebarState === 'entity') {
                if (nextQuery != null && this.props.match.params.query !== nextQuery) {
                    // this.props.dispatch(fetchEntity(decodeURIComponent(nextprops.match.params.query)));
                }
                if (nextprops.match.params.sidebarState !== 'entity' && this.props.currentNode !== null) {
                    this.props.dispatch(clearCurrentEntity())
                }
            }
        }
    }

    render() {
        const { data, isCovered, onMouseOver } = this.props;
        return (
            <div className="canvas">
                <SideNavBar/>
                <div id="graph-canvas">
                  <Graph graph={this.graph} onMouseOver={onMouseOver} data={data} displayMinimap={false}/>
                </div>
                <GraphSidebar isCovered={isCovered} graph={this.graph} data={data}/>
                {/*<BottomBar/>*/}
                <PublishButton graph={this.graph}/>
            </div>
        )
    }
}

function mapDispatchToProps(dispatch) {
    return {
        dispatch: dispatch,
    };
}

function mapStateToProps(state) {
    return {
        sidebarVisible: state.graph.sidebarVisible,
        currentNode: state.graphSidebar.currentEntity,
        data: state.graph.data
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Canvas));
