var async = require('async');
var _ = require('underscore');
var $ = require('jquery');
var React = require('react/addons');
var Router = require('react-router');
var Modal = require('react-bootstrap/Modal');
var RetinaImage = require('react-retina-image');
var ModalTrigger = require('react-bootstrap/ModalTrigger');
var ContainerModal = require('./ContainerModal.react');
var ContainerStore = require('./ContainerStore');
var Header = require('./Header.react');
var docker = require('./docker');

var Link = Router.Link;
var RouteHandler = Router.RouteHandler;
var Navigation= Router.Navigation;

var ContainerList = React.createClass({
  getInitialState: function () {
    return {
      containers: []
    };
  },
  componentDidMount: function () {
    this.updateContainers();
    ContainerStore.addChangeListener(ContainerStore.CONTAINERS, this.updateContainers);
  },
  componentWillMount: function () {
    this._start = Date.now();
  },
  componentWillUnmount: function () {
    ContainerStore.removeChangeListener(ContainerStore.CONTAINERS, this.updateContainers);
  },
  updateContainers: function () {
    // Sort by name
    var containers = _.values(ContainerStore.containers()).sort(function (a, b) {
      return a.Name.localeCompare(b.Name);
    });
    this.setState({containers: containers});
  },
  render: function () {
    var self = this;
    var containers = this.state.containers.map(function (container) {
      var downloadingImage = null, downloading = false;
      var env = container.Config.Env;
      if (env.length) {
        var obj = _.object(env.map(function (e) {
          return e.split('=');
        }));
        if (obj.KITEMATIC_DOWNLOADING) {
          downloading = true;
        }
        downloadingImage = obj.KITEMATIC_DOWNLOADING_IMAGE || null;
      }

      var imageName = downloadingImage || container.Config.Image;

      // Synchronize all animations
      var style = {
        WebkitAnimationDelay: (self._start - Date.now()) + 'ms'
      };

      var state;
      if (downloading) {
        state = <div className="state state-downloading"><div style={style} className="downloading-arrow"></div></div>;
      } else if (container.State.Running && !container.State.Paused) {
        state = <div className="state state-running"><div style={style} className="runningwave"></div></div>;
      } else if (container.State.Restarting) {
        state = <div className="state state-restarting" style={style}></div>;
      } else if (container.State.Paused) {
        state = <div className="state state-paused"></div>;
      } else if (container.State.ExitCode) {
        // state = <div className="state state-error"></div>;
        state = <div className="state state-stopped"></div>;
      } else {
        state = <div className="state state-stopped"></div>;
      }

      var name = container.Name.replace('/', '');

      return (
        <Link key={name} data-container={name} to="container" params={{name: name}}>
          <li>
            {state}
            <div className="info">
              <div className="name">
                {name}
              </div>
              <div className="image">
                {imageName}
              </div>
            </div>
          </li>
        </Link>
      );
    });
    return (
      <ul>
        {containers}
      </ul>
    );
  }
});

module.exports = ContainerList;
