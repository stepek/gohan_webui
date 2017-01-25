import React, {Component, PropTypes} from 'react';
import {Button} from '@blueprintjs/core';

export default class SelectTenant extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: null
    };
  }

  handleSelectTenantSubmit = event => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.props.onTenantSubmit(this.state.value);
  };

  handleTenantChange = event => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.setState({value: event.target.value});
  };

  buildSelectOptions = () => {
    return this.props.tenants.map(
      (tenant, key) => {
        return <option value={tenant.name} key={key}>{tenant.name}</option>;
      }
    );
  };


  render() {
    return (
      <form onSubmit={this.handleSelectTenantSubmit}>
        <label className="pt-label">
            Select tenant
            <div className="pt-select pt-large">
              <select onChange={this.handleTenantChange} defaultValue={''}>
                <option value={''} />
                {
                this.buildSelectOptions()
              }
              </select>
            </div>
        </label>

        <Button type="submit" className="pt-intent-primary auth-submit"
          disabled={!this.state.value}>
          Select tenant
        </Button>
      </form>
    );
  }
}

SelectTenant.propTypes = {
  onTenantSubmit: PropTypes.func.isRequired,
  tenants: PropTypes.array.isRequired
};