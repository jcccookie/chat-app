import React from 'react';
import firebase from '../../firebase';
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import md5 from 'md5';

class Register extends React.Component {
   state = {
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      errors: [],
      loading: false, // To prevent from clicking submit button twice,.
      usersRef: firebase.database().ref('users')
   };

   isFormValid = () => {
      let errors = [];
      let error;

      if (this.isFormEmpty(this.state)) {
         // throw error
         error = { message: 'Fill in all fields' };
         this.setState({ errors: errors.concat(error) });
         return false;
      } else if (!this.isPasswordValid(this.state)) {
         // throw error
         error = { message: 'Password is invalid' };
         this.setState({ errors: errors.concat(error) });
      } else {
         // form valid
         return true;
      }
   };

   isFormEmpty = ({ username, email, password, passwordConfirmation }) => {
      return !username.length || !email.length || !password.length || !passwordConfirmation.length;
   };

   isPasswordValid = ({ password, passwordConfirmation }) => {
      if (password.length < 6 || passwordConfirmation.length < 6) {
         return false;
      } else if (password !== passwordConfirmation) {
         return false;
      } else {
         return true;
      }
   };

   displayErrors = errors => errors.map((error, i) => <p key={i}>{error.message}</p>)

   handleChange = (e) => {
      this.setState({ [e.target.name]: e.target.value }); // Computed property names
   };

   handleSubmit = (e) => {
      e.preventDefault();
      
      if (this.isFormValid()) {
         this.setState({ errors: [], loading: true });

         firebase
            .auth()
            .createUserWithEmailAndPassword(this.state.email, this.state.password) // Create user
            .then(createdUser => {
               console.log(createdUser);
               createdUser.user.updateProfile({ // Update user's profile
                  displayName: this.state.username,
                  photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
               })
               .then(() => {
                  this.saveUser(createdUser).then(() => { // Save user's name and avatar to fb realtime database
                     console.log('user saved');
                  });
               })
               .catch(err => {
                  console.log(err);
                  this.setState({ errors: this.state.errors.concat(err), loading: false });
               })
            })
            .catch(err => {
               console.log(err);
               this.setState({ errors: this.state.errors.concat(err), loading: false });
            });
      }
   };

   saveUser = createdUser => {
      return this.state.usersRef.child(createdUser.user.uid).set({
         name: createdUser.user.displayName,
         avatar: createdUser.user.photoURL
      });
   };

   handleInputError = (errors, inputName) => {
      return errors.some(error => error.message.toLowerCase().includes(inputName))
      ? "error" 
      : "";
   };

   render () {
      const { username, email, password, passwordConfirmation, errors, loading } = this.state;

      return (
         <Grid textAlign="center" verticalAlign="middle" className='app'>
            <Grid.Column style={{ maxWidth: 450 }}>
               <Header as="h1" icon color="orange" textAlign="center">
                  <Icon name="signup" color="orange"/>
                  Register For Chat App
               </Header>
               <Form onSubmit={this.handleSubmit} size="large">
                  <Segment stacked>
                     <Form.Input 
                        fluid 
                        name="username" 
                        placeholder="Username" 
                        icon="user" 
                        iconPosition="left" 
                        onChange={this.handleChange} 
                        type="text"
                        value={username}
                     />
                     <Form.Input 
                        fluid 
                        name="email" 
                        placeholder="Email Address" 
                        icon="mail" 
                        iconPosition="left" 
                        onChange={this.handleChange} 
                        type="email"
                        value={email}
                        className={this.handleInputError(errors, 'email')}
                     />
                     <Form.Input 
                        fluid 
                        name="password" 
                        placeholder="Password" 
                        icon="lock" 
                        iconPosition="left" 
                        onChange={this.handleChange} 
                        type="password"
                        value={password}
                        className={this.handleInputError(errors, 'password')}
                     />
                     <Form.Input 
                        fluid 
                        name="passwordConfirmation" 
                        placeholder="Password Confirmation" 
                        icon="repeat" 
                        iconPosition="left" 
                        onChange={this.handleChange} 
                        type="password"
                        value={passwordConfirmation}
                        className={this.handleInputError(errors, 'password')}
                     />
                     <Button disabled={loading} className={loading ? 'loading' : ''} color="orange" fluid size="large">Submit</Button>
                  </Segment>
               </Form>
               {errors.length > 0 && (
                  <Message error>
                     <h3>Errors</h3>
                     {this.displayErrors(errors)}
                  </Message>
               )}
               <Message>
                  Already a user? <Link to="/login">Login</Link>
               </Message>
            </Grid.Column>
         </Grid>
      )
   }
};

export default Register;