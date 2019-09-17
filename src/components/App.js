import React from 'react';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { connect } from 'react-redux';

import ColorPanel from '../components/ColorPanel/ColorPanel';
import SidePanel from '../components/SidePanel/SidePanel';
import Messages from '../components/Messages/Messages';
import MetaPanel from '../components/MetaPanel/MetaPanel';

const App = ({ currentUser, currentChannel, isPrivateChannel, userPosts, primaryColor, secondaryColor }) => (
  <Grid columns="equal" className="app" style={{ background: secondaryColor }}>
    <ColorPanel 
      key={currentUser & currentUser.name}
      currentUser={currentUser}
    />
    <SidePanel 
      key={currentUser && currentUser.uid}
      currentUser={currentUser}
      primaryColor={primaryColor}
      currentChannel={currentChannel}
    />

    <Grid.Column style={{ marginLeft: 320, maxWidth: 720 }}>
      <Messages 
        key={currentChannel && currentChannel.id}
        currentChannel={currentChannel}
        currentUser={currentUser}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>

    <Grid.Column width={4} style={{ maxWidth: 350 }}>
      <MetaPanel 
        key={currentChannel && currentChannel.id}
        isPrivateChannel={isPrivateChannel}
        currentChannel={currentChannel}
        userPosts={userPosts}
      />
    </Grid.Column>
  </Grid>
);

const mapStateToProps = (state) => ({
  currentUser: state.user.currentUser,
  currentChannel: state.channel.currentChannel,
  isPrivateChannel: state.channel.isPrivateChannel,
  userPosts: state.channel.userPosts,
  primaryColor: state.colors.primaryColor,
  secondaryColor: state.colors.secondaryColor
});

export default connect(mapStateToProps)(App);