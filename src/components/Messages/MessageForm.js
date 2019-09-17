import React from 'react';
import uuid from 'uuid/v4';
import firebase from '../../firebase';
import { Segment, Button, Input } from 'semantic-ui-react';
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

import FileModal from './FileModal';
import ProgressBar from './ProgressBar';

class MessageForm extends React.Component {
   state = {
      storageRef: firebase.storage().ref(),
      typingRef: firebase.database().ref('typing'),
      uploadTask: null,
      uploadState: '',
      percentUploaded: 0,
      message: '',
      channel: this.props.currentChannel,
      user: this.props.currentUser,
      loading: false,
      errors: [],
      modal: false,
      emojiPicker: false
   }

   componentWillUnmount() {
      if (this.state.uploadTask !== null) {
         this.state.uploadTask.cancel();
         this.setState({ uploadTask: null });
      }
   }

   openModal = () => this.setState({ modal: true });

   closeModal = () => this.setState({ modal: false });

   handleChange = e => {
      this.setState({ [e.target.name]: e.target.value})
   }

   handleKeyUp = e => {
      // Ctrl + Enter
      if (e.ctrlKey && e.keyCode === 13) {
         this.sendMessage();
      }

      const { message, typingRef, channel, user } = this.state;

      if (message) {
         typingRef
            .child(channel.id)
            .child(user.uid)
            .set(user.displayName)
      } else {
         typingRef
            .child(channel.id)
            .child(user.uid)
            .remove()
      }
   }

   handleTogglePicker = () => {
      this.setState({ emojiPicker: !this.state.emojiPicker });
   }

   handleAddEmoji = emoji => {
      const oldMessage = this.state.message;
      const newMessage = this.colonToUnicode(`${oldMessage}${emoji.colons}`);
      this.setState({ message: newMessage, emojiPicker: false });
      setTimeout(() => this.messageInputRef.focus(), 0)
   }

   colonToUnicode = message => {
      return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
        x = x.replace(/:/g, "");
        let emoji = emojiIndex.emojis[x];
        if (typeof emoji !== "undefined") {
          let unicode = emoji.native;
          if (typeof unicode !== "undefined") {
            return unicode;
          }
        }
        x = ":" + x + ":";
        return x;
      });
    };

   createMessage = (fileUrl = null) => {
      const message = {
         timestamp: firebase.database.ServerValue.TIMESTAMP,
         user: { 
            id: this.state.user.uid,
            name: this.state.user.displayName,
            avatar: this.state.user.photoURL
         }
      }
      if (fileUrl !== null) {
         message['image'] = fileUrl;
      } else {
         message['content'] = this.state.message;
      }
      return message;
   }

   sendMessage = () => {
      const { getMessagesRef } = this.props;
      const { message, channel, typingRef, user } = this.state;

      if (message) {
         this.setState({ loading: true });
         getMessagesRef()
            .child(channel.id) // To match with the channel's id
            .push() // Create message's id
            .set(this.createMessage()) // Store message
            .then(() => {
               this.setState({ loading: false, message: '', errors: [] })
               typingRef
                  .child(channel.id)
                  .child(user.uid)
                  .remove()
            })
            .catch(err => {
               console.error(err);
               this.setState({
                  loading: false,
                  errors: this.state.errors.concat(err)
               })
            })
      } else {
         this.setState({
            errors: this.state.errors.concat({ message: 'Add a message' })
         })
      }
   };

   getPath = () => {
      if (this.props.isPrivateChannel) {
         return `chat/private/${this.state.channel.id}`;
      } else {
         return 'chat/public';
      }
   }

   // Upload file to firebase storage
   uploadFile = (file, metadata) => {
      const pathToUpload = this.state.channel.id;
      const ref = this.props.getMessagesRef();
      const filePath = `${this.getPath()}/${uuid()}.jpg`;

      this.setState({
         uploadState: 'uploading',
         // 1. Upload an image to firebase storage
         uploadTask: this.state.storageRef.child(filePath).put(file, metadata) 
         }, () => {
            // 2. Track the process while uploading
            this.state.uploadTask.on('state_changed', snap => {
               const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
               this.setState({ percentUploaded });
            }, 
            err => {
               console.error(err);
               this.setState({
                  errors: this.state.errors.concat(err),
                  uploadState: 'error',
                  uploadTask: null
               })
            }, 
            // 3. Get an image's location info
            () => {
               this.state.uploadTask.snapshot.ref.getDownloadURL() // Get image's url 
               .then(downloadUrl => {
                  // 4. Store file info to a realtime database
                  this.sendFileMessage(downloadUrl, ref, pathToUpload); 
               })
               .catch(err => {
                  console.error(err);
                  this.setState({
                     errors: this.state.errors.concat(err),
                     uploadState: 'error',
                     uploadTask: null
                  })
               })
            })
         }
      )
   }

   // Store file info to realtime database
   sendFileMessage = (fileUrl, ref, pathToUpload) => {
      ref.child(pathToUpload)
         .push()
         .set(this.createMessage(fileUrl))
         .then(() => {
            this.setState({ uploadState: 'done' })
         })
         .catch(err => {
            console.error(err);
            this.setState({
               errors: this.state.errors.concat(err)
            })
         })
   }

   render(){
      const { errors, message, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state;

      return (
         <Segment className='message__form'>
            {emojiPicker && (
               <Picker 
                  style={{position: 'absolute'}}
                  set="apple"
                  title="Pick your emoji"
                  emoji="point_up"
                  // className='emoji'
                  onSelect={this.handleAddEmoji}
               />
            )}
            <Input 
               fluid
               name="message"
               style={{ marginBottom: '0.7em'}}
               onChange={this.handleChange}
               onKeyUp={this.handleKeyUp}
               value={message}
               ref={node => (this.messageInputRef = node)}
               label={
                  <Button 
                     icon={emojiPicker ? 'close' : 'add'} 
                     content={emojiPicker ? "Close" : null} 
                     onClick={this.handleTogglePicker} 
                  />
               }
               labelPosition="left"
               placeholder="Write your message"
               className={
                  errors.some(error => error.message.includes('message')) ? 'error' : ''
               }
            />
            <Button.Group icon widths="2">
               <Button 
                  onClick={this.sendMessage}
                  color="orange"
                  content="Add Reply (Ctrl + Enter)"
                  labelPosition="left"
                  icon="edit"
                  disabled={loading}
               />
               <Button 
                  color="teal"
                  disabled={uploadState === "uploading"}
                  onClick={this.openModal}
                  content="Upload Media"
                  labelPosition="right"
                  icon="cloud upload"
               />
               
            </Button.Group>
            <FileModal 
               modal={modal}
               closeModal={this.closeModal}
               uploadFile={this.uploadFile}
            />
            <ProgressBar 
               uploadState={uploadState}
               percentUploaded={percentUploaded}
            />
         </Segment>
      )
   }
};

export default MessageForm;