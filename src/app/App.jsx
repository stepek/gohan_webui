import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {FocusStyleManager} from '@blueprintjs/core';

import {fetchSchema} from './../schema/SchemaActions';
import Navbar from './components/Navbar';
import SidebarMenu from './components/SidebarMenu';
import ErrorToaster from './../error/ErrorToaster';
import {logout, selectTenant} from '../auth/AuthActions';
import {getSidebarMenuItems} from './components/SidebarSelectors';

FocusStyleManager.onlyShowFocusOnTabs();

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openUserMenu: false,
      openSidebar: true,
      contentClassNames: ''
    };
  }

  componentWillMount() {
    this.props.fetchSchema();
  }

  handleDismissClick = event => {
    if (event) {
      event.preventDefault();
    }
    this.props.resetErrorMessage();
  };

  handleRequestLogout = () => {
    this.props.logout();
  };

  handleRequestChangeTenant = tenantId => {
    this.props.selectTenant(tenantId);
  };

  handleToggleSidebar = () => {
    if (this.state.openSidebar) {
      this.setState({
        openSidebar: false,
        contentClassNames: 'sidebar-hidden'
      });
    } else {
      this.setState({
        openSidebar: true,
        contentClassNames: ''
      });
    }
  };

  render() {
    const {children} = this.props;
    const {user, tenant, tenants} = this.props.authReducer;

    return (
      <div>
        <Navbar userName={user.username} tenants={tenants}
          activeTenant={tenant.name} onRequestLogout={this.handleRequestLogout}
          onRequestChangeTenant={this.handleRequestChangeTenant}
          onToggleSidebar={this.handleToggleSidebar} openSidebar={this.state.openSidebar}
        />
        <SidebarMenu menuItems={this.props.sidebarMenuItems} open={this.state.openSidebar}/>
        <ErrorToaster/>
        <div className={`view-content ${this.state.contentClassNames}`}>
          {children}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  schemaReducer: PropTypes.object,
  children: PropTypes.node
};

function mapStateToProps(state) {
  return {
    sidebarMenuItems: getSidebarMenuItems(state),
    schemaReducer: state.schemaReducer,
    authReducer: state.authReducer
  };
}

export default connect(mapStateToProps, {
  fetchSchema,
  logout,
  selectTenant
})(App);
