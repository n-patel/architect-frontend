import React, {Component} from "react";
import SearchResults from "../searchResults";
import SearchBar from "../../searchBar";
import ListData from "../listData"
import {Link,withRouter} from "react-router-dom";
import {connect} from "react-redux";
import Entity from "../entity";

import "./style.css";

class GraphSidebar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            renderList: props.match.params ? props.match.params.sidebarState === "list" : false,
            renderSearch: props.match.params ? props.match.params.sidebarState === "search" : false,
            renderEntity: props.match.params ? props.match.params.sidebarState === "entity" : false,
            history: [],
            listener: null,
            // projectName: "",
            // author: "",
            // description: ""
        };
    }

    componentWillMount() {
        let listener = this.props.history.listen((location, action) => {
            this.setState({history: [...this.state.history, location]});
        });
        this.setState({listener: listener})
    }

    // componentDidMount() {
    //     const { match } = this.props;
    //     if (match.params && match.params.sidebarState === 'publish') {
    //         console.log("recognized that in publish space")
    //         let projId = match.params.query;
    //         if (projId != null) {
    //             console.log("recognized projId exists", projId);
    //             let res = this.props.dispatch(loadLink(projId));
    //             console.log("hi back in main", res)
    //             // this.setState({projectName: res.name, author: res.author, description: res.description})
    //         }
    //     }
    // }

    componentWillUnmount() {
        this.state.listener();
    }

    componentWillReceiveProps(nextprops) {
        if (this.props.location.pathname !== nextprops.location.pathname) {
            this.setState({
                renderList: nextprops.match.params ? nextprops.match.params.sidebarState === "list" : false,
                renderSearch: nextprops.match.params ? nextprops.match.params.sidebarState === "search" : false,
                renderEntity: nextprops.match.params ? nextprops.match.params.sidebarState === "entity" : false
            })
        }
    }

    goToSearchPage = (query) => {
        let newPathname = '/explore/search/' + query;
        this.props.history.push(newPathname);
    };


    goToListPage = (query) => {
        let newPathname = '/explore/list/' + query;
        this.props.history.push(newPathname);
    };

    renderSearch() {
        const { graph, data } = this.props;
        return (
            <div>
                <SearchResults graph={graph} entity data={data}/>
            </div>
        )
    }

    renderList() {
        const { graph, data } = this.props;
        return (<ListData graph={graph} data={data}/>)
    }

    // handleProjectNameChange = (val) => {
    //     this.setState({projectName: val})
    // }
    //
    // handleAuthorChange = (val) => {
    //     this.setState({author: val})
    // }
    //
    // handleDescriptionChange = (val) => {
    //     this.setState({description: val})
    // }
    //
    // handlePublishSubmit = async () => {
    //     const { projectName, author, description } = this.state;
    //     const { graph } = this.props;
    //     let res = await saveLink(projectName, author, description, graph)
    //     // modal popbox saying something or the antd popup
    // };
    //
    // renderPublish() {
    //     const { projectName, author, description } = this.state;
    //     return (
    //         <div>
    //             <Input placeholder="Project Name" value={projectName} onChange={(e) => this.handleProjectNameChange(e.target.value)}/>
    //             <Input placeholder="Author" value={author} onChange={(e) => this.handleAuthorChange(e.target.value)}/>
    //             <Input placeholder="Description" value={description} onChange={(e) => this.handleDescriptionChange(e.target.value)}/>
    //             <Button type="primary" onClick={() => this.handlePublishSubmit()}>Publish</Button>
    //         </div>
    //     )
    // }

    renderEntity() {
        return (
            <Entity graph={this.props.graph} id={this.props.match.params.query}/>
        )
    }

    render() {
        const { sidebarVisible, isCovered, match } = this.props;
        return (
            <div className={"sidebar " + (sidebarVisible ? "slide-out" : "slide-in") + (isCovered ? " hidden" : "")}>
                <div className="flex-row d-flex full-height">
                    <div className="sidebar-container" key="sidebar-container">
                        <div className="searchbar-container">
                            {
                                !this.state.renderList ?
                                <SearchBar onSubmit={this.goToSearchPage} value={match.params.sidebarState === "search" && match.params.query ? match.params.query : ""} showSettings={true} placeholder={'Search Database (e.g. "Russia", "Kony", or "DPRK2")'}/>
                                :
                                <SearchBar onSubmit={this.goToListPage} value={match.params.sidebarState === "list" && match.params.query ? match.params.query : ""} showSettings={true} placeholder={'Search Entity List (e.g. "Russia", "Kony", or "DPRK2")'}/>
                            }
                        </div>
                        <div className="tab-container">
                            <Link to="/explore/search">
                                <div className="tab">OFAC SDN</div>
                            </Link>
                            <Link to="/explore/entity">
                                <div className="tab">Entity</div>
                            </Link>
                            <Link to="/explore/list">
                                <div className="tab">List</div>
                            </Link>
                        </div>
                        <div className="full-width flex-column y-scrollable">
                            {
                                this.state.renderSearch ?
                                    this.renderSearch()
                                    : null
                            }
                            {
                                this.state.renderEntity ?
                                    this.renderEntity()
                                    : null
                            }
                            {
                                this.state.renderList ?
                                    this.renderList()
                                    : null
                            }
                        </div>
                    </div>
                </div>
                {this.state.history.map((res, key) => (<div key={key}> {res.pathname + res.search} </div>))}
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
        sidebarVisible: state.graph.sidebarVisible
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GraphSidebar));
