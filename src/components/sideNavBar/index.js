import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from "react-redux";
import { resetProjectDispatch } from "../../redux/actions/graphActions";

import './style.css'

const SideNavBar = (props) => {
  return (
    <div className="side-nav">
      <Link to='/' onClick={() => { props.dispatch(resetProjectDispatch()); }}>
        <div className="side-nav-button">
          <i className="material-icons">home</i>
        </div>
      </Link>
      <Link to='/data'>
        <div className="side-nav-button">
          <i className="material-icons">data_usage</i>
        </div>
      </Link>
      <Link to='/build' onClick={() => { props.dispatch(resetProjectDispatch()); }}>
        <div className="side-nav-button">
          <i className="material-icons">dashboard</i>
        </div>
      </Link>
      <Link to='/user'>
        <div className="side-nav-button">
          <i className="material-icons">account_box</i>
        </div>
      </Link>
      <div className="bottom">
        <Link to='/settings'>
          <div className="side-nav-button">
            <i className="material-icons">settings</i>
          </div>
        </Link>
        <Link to='/help'>
          <div className="side-nav-button">
            <i className="material-icons">help</i>
          </div>
        </Link>
      </div>
    </div>
  );
};

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  };
}

export default withRouter(connect(mapDispatchToProps)(SideNavBar));