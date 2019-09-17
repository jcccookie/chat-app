import React from 'react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';
import { setCurrentChannel, setPrivateChannel } from '../../actions';


class Channels extends React.Component {
   state = {
      user: this.props.currentUser,
      channel: null,
      channels: [],
      channelName: "",
      channelDetails: "",
      channelsRef: firebase.database().ref('channels'),
      messagesRef: firebase.database().ref('messages'),
      typingRef: firebase.database().ref('typing'),
      notifications: [],
      modal: false,
      firstLoad: true,
      activeChannel: ''
   };

   componentDidMount() {
      this.addListener();
   }

   componentWillUnmount() {
      this.removeListeners();
   }

   addListener = () => {
      let loadedChannels = [];
      this.state.channelsRef.on('child_added', snap => {
         loadedChannels.push(snap.val());
         this.setState({ channels: loadedChannels }, () => this.setFirstChannel());
         this.addNotificationListener(snap.key);
      });
   };

   addNotificationListener = channelId => {
      this.state.messagesRef.child(channelId).on('value', snap => {
         if (this.state.channel) {
            this.handleNotifications(channelId, this.state.channel.id, this.state.notifications, snap);
         }
      })
   }

   handleNotifications = (channelId, currentChannelId, notifications, snap) => {
      let lastTotal = 0;

      let index = notifications.findIndex(notification => notification.id === channelId);

      if (index !== -1) {
         if (channelId !== currentChannelId) {
            lastTotal = notifications[index].total;

            if (snap.numChildren() - lastTotal > 0) {
               notifications[index].count = snap.numChildren() - lastTotal;
            }
         }
         notifications[index].lastKnownTotal = snap.numChildren();
      } else {
         notifications.push({
            id: channelId,
            total: snap.numChildren(),
            lastKnownTotal: snap.numChildren(),
            count: 0
         });
      };

      this.setState({ notifications });
   }

   removeListeners = () => {
      this.state.channelsRef.off();
      this.state.channels.forEach(channel => {
         this.state.messagesRef.child(channel.id).off();
      })
   };

   setFirstChannel = () => {
      const firstChannel = this.state.channels[0];
      if (this.state.firstLoad && this.state.channels.length > 0) {
         this.props.setCurrentChannel(firstChannel);
         this.setActiveChannel(firstChannel);
         this.setState({ channel: firstChannel });
      }
      this.setState({ firstLoad: false });
   };

   handleSubmit = e => {
      e.preventDefault();

      if (this.isFormValid(this.state)) {
         this.addChannel();
      };
   }

   // Add channel to database
   addChannel = () => {
      const { channelsRef, channelName, channelDetails, user } = this.state;

      const key = channelsRef.push().key; // Get a key from database

      const newChannel = {
         id: key,
         name: channelName,
         detail: channelDetails,
         createdBy: {
            name: user.displayName,
            avatar: user.photoURL
         }
      };

      channelsRef
         .child(key)
         .update(newChannel)
         .then(() => {
            this.setState({ channelName: '', channelDetails: '' }) // Initialize value of form input values
            this.closeModal();
            console.log('channel added');
         })
         .catch(err => {
            console.error(err);
         })
   }; 

   isFormValid = ({ channelName, channelDetails }) => channelName && channelDetails;

   handleChange = e => {
      this.setState({ [e.target.name]: e.target.value })
   }

   changeChannel = channel => {
      this.setActiveChannel(channel);
      this.state.typingRef
         .child(this.state.channel.id)
         .child(this.state.user.uid)
         .remove()
      this.clearNotifications();
      this.props.setCurrentChannel(channel);
      this.props.setPrivateChannel(false);
      this.setState({ channel });
   }

   clearNotifications = () => {
      let index = this.state.notifications.findIndex(notification => notification.id === this.state.channel.id);

      if (index !== -1) {
         let updatedNotifications = [...this.state.notifications];
         updatedNotifications[index].total = this.state.notifications[index].lastKnownTotal;
         updatedNotifications[index].total = 0;
         this.setState({ notifications: updatedNotifications });
      }
   }

   setActiveChannel = channel => {
      this.setState({ activeChannel: channel.id });
   };

   getNotificationCount = channel => {
      let count = 0;

      this.state.notifications.forEach(notification => {
         if (notification.id === channel.id) {
            count = notification.count;
         }
      });

      if (count > 0) return count;
   }

   displayChannels = channels => 
      channels.length > 0 && 
      channels.map(channel => (
         <Menu.Item
            key={channel.id}
            onClick={() => this.changeChannel(channel)}
            name={channel.name}
            style={{ opacity: 0.9 }}
            active={channel.id === this.state.activeChannel}
         >
            {this.getNotificationCount(channel) && (
               <Label color="red">{this.getNotificationCount(channel)}</Label>
            )}
            # {channel.name}
         </Menu.Item>
   ));
   

   openModal = () => this.setState({ modal: true });

   closeModal = () => this.setState({ modal: false });

   render () {
      const { channels, modal } = this.state;

      return (
         <React.Fragment>

            <Menu.Menu className="menu">
               <Menu.Item>
                  <span>
                     <Icon name="exchange" /> CHANNELS
                  </span>{" "}
                  ({ channels.length }) <Icon name="add" onClick={this.openModal}/>
               </Menu.Item>
               {this.displayChannels(channels)}
            </Menu.Menu>

            {/* Add channel Modal */}
            <Modal basic open={modal} onClose={this.closeModal}>
               <Modal.Header>Add a Channel</Modal.Header>
               <Modal.Content>
                  <Form onSubmit={this.handleSubmit}>
                     <Form.Field>
                        <Input 
                           fluid
                           label="Name of Channel"
                           name="channelName"
                           onChange={this.handleChange}
                        />
                     </Form.Field>
                     <Form.Field>
                        <Input 
                           fluid
                           label="About the Channel"
                           name="channelDetails"
                           onChange={this.handleChange}
                        />
                     </Form.Field>
                  </Form>
               </Modal.Content>

               <Modal.Actions>
                  <Button color="green" inverted onClick={this.handleSubmit}>
                     <Icon name="checkmark"/> Add
                  </Button>
                  <Button color="red" inverted onClick={this.closeModal}>
                     <Icon name="remove"/> Cancel
                  </Button>
               </Modal.Actions>
            </Modal>

         </React.Fragment>
      )
   }
}

export default connect(undefined, { setCurrentChannel, setPrivateChannel })(Channels);