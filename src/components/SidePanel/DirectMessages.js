import React from 'react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { Menu, Icon } from 'semantic-ui-react';

class DirectMessages extends React.Component {
   state = {
      activeChannel: '',
      user: this.props.currentUser,
      users: [], // users except for current user
      usersRef: firebase.database().ref('users'),
      connectedRef: firebase.database().ref('.info/connected'),
      presenceRef: firebase.database().ref('presence'),
   }

   componentDidMount() {
      if (this.state.user) {
         this.addListeners(this.state.user.uid);
      }
   }

   componentWillUnmount() {
      this.removeListeners();
   }

   removeListeners = () => {
      this.state.usersRef.off();
      this.state.presenceRef.off();
      this.state.connectedRef.off();
   }


   addListeners = currentUserUid => {
      let loadedUsers = []; // Container for storing users except for current user
      this.state.usersRef.on('child_added', snap => {
         if (currentUserUid !== snap.key) {
            let user = snap.val();
            user['uid'] = snap.key;
            user['status'] = 'offline';
            loadedUsers.push(user);
            this.setState({ users: loadedUsers });
         }
      });
      // Database provides a special location at /.info/connected which is updated every time the Firebase Realtime Database client's connection state changes.
      this.state.connectedRef.on('value', snap => {
         // if current user is connected
         if (snap.val() === true) {
            // Set presence info true to realtime data 
            const ref = this.state.presenceRef.child(currentUserUid);
            ref.set(true);
            // Ensures the data at this location is deleted when the client is disconnected (due to closing the browser, navigating to a new page, or network issues).
            ref.onDisconnect().remove(err => {
               if (err !== null) {
                  console.error(err);
               }
            })
         }
      })

      // When other user's logged in
      this.state.presenceRef.on('child_added', snap => {
         if (currentUserUid !== snap.key) {
            this.addStatusToUser(snap.key);
         }
      })
      // When other user's logged out
      this.state.presenceRef.on('child_removed', snap => {
         if (currentUserUid !== snap.key) {
            this.addStatusToUser(snap.key, false);
         }
      })
   }

   addStatusToUser = (userId, connected = true) => {
      const updatedUsers = this.state.users.reduce((acc, user) => {
         if (user.uid === userId) {
            user['status'] = `${connected ? 'online' : 'offline'}`;
         }
         return acc.concat(user);
         
      }, []);

      this.setState({ users: updatedUsers });
   }

   isUserOnline = user => user.status === 'online';

   changeChannel = user => {
      const channelId = this.getChannelId(user.uid);
      const channelData = {
         id: channelId,
         name: user.name
      };
      this.props.setCurrentChannel(channelData);
      this.props.setPrivateChannel(true);
      this.setActiveChannel(user.uid);
   }

   getChannelId = userId => {
      const currentUserId = this.state.user.uid;
      return userId < currentUserId ? `${userId}/${currentUserId}` : `${currentUserId}/${userId}`;
   }

   setActiveChannel = (userId) => {
      this.setState({ activeChannel: userId });
   }

   render () {
      const { users, activeChannel } = this.state;

      return (
         <Menu.Menu className="menu">
            <Menu.Item>
               <span>
                  <Icon name="mail"/> DIRECT MESSAGES
               </span>{' '}
               ({ users.length })
            </Menu.Item>
            {/* Users to send direct messages */}
            {users.map(user => (
               <Menu.Item
                  key={user.uid}
                  active={user.uid === activeChannel}
                  onClick={() => this.changeChannel(user)}
                  style={{ opacity: 0.9, fontStyle: 'italic'}}
               >
                  <Icon 
                     name="circle"
                     color={this.isUserOnline(user) ? 'green' : 'red'}
                  />
                  @ {user.name}
               </Menu.Item>
            ))}
         </Menu.Menu>
      )
   }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(DirectMessages);