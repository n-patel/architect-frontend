import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../redux/actions/';

import { Link, withRouter } from 'react-router-dom';
import { getProjects } from "../../server/index.js";

import './style.css';

class Investigations extends Component {
	constructor(props) {
		super(props);
		this.state = {
			projects: [],
		};
	}

	componentDidMount() {
		getProjects().then(data => {
			this.setState({projects: data.message});
			console.log(this.state.projects);
		});
	}


	render() {
		return (
			<div className="container y-scrollable">
				<h1 className="investigations-page-header">My Investigations</h1>
				{/*<p>{"All projects as JSON: " + JSON.stringify(this.state.projects)}</p>*/}
				<div className="row investigations-grid">
				{this.state.projects.map((proj) => {
					let image_blob = "data:image/png;base64,";
								
					if (proj.img_blob) {
						image_blob += proj.img_blob;
					}
					else {
						image_blob += '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';
					}
					
				
					return (
						<div key={proj._id} className='col-md-3'>
							<div className="card investigation-card">
								<img className="card-img-top" src={image_blob}>
									
								</img>
								<div className="card-body investigation-card-body">
									<h5 className="card-title investigation-card-title">{proj.name}</h5>
									<p className="card-text investigation-card-text">{proj.description}</p>
									<div className="text-center">
										<Link to={`/build/${proj._id}`}>
											<button className="btn btn-primary">
												Launch Investigation
											</button>
										</Link>
									</div>
								</div>	
							</div>
						</div>
					)
				})}
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

function mapStateToProps(state) {
  return {
    isAuthenticated: state.data.user.isAuthenticated,
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Investigations));