import React from 'react';
import firebase from '../../firebase';
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

class Login extends React.Component {
   state = {
      email: '',
      password: '',
      errors: [],
      loading: false, // To prevent from clicking submit button twice,.
   };

   displayErrors = errors => errors.map((error, i) => <p key={i}>{error.message}</p>)

   handleChange = (e) => {
      this.setState({ [e.target.name]: e.target.value }); // Computed property names
   };

   handleSubmit = (e) => {
      e.preventDefault();
      
      if (this.isFormValid(this.state)) {
         this.setState({ errors: [], loading: true });

         firebase
            .auth()
            .signInWithEmailAndPassword(this.state.email, this.state.password)
            .then(signedInUser => {
               console.log(signedInUser);
            })
            .catch(err => {
               console.log(err);
               this.setState({
                  errors: this.state.errors.concat(err),
                  loading: false
               })
            })
      }
   };

   isFormValid = ({ email, password }) => email && password;

   handleInputError = (errors, inputName) => {
      return errors.some(error => error.message.toLowerCase().includes(inputName))
      ? "error" 
      : "";
   };

   render () {
      const { email, password, errors, loading } = this.state;

      return (
         <Grid textAlign="center" verticalAlign="middle" className='app'>
            <Grid.Column style={{ maxWidth: 450 }}>
               <Header as="h1" icon color="blue" textAlign="center">
                  <Icon name="chat" color="blue"/>
                  Login to start a chat
               </Header>
               <Form onSubmit={this.handleSubmit} size="large">
                  <Segment stacked>
                     
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
                     <Button disabled={loading} className={loading ? 'loading' : ''} color="blue" fluid size="large">Submit</Button>
                  </Segment>
               </Form>
               {errors.length > 0 && (
                  <Message error>
                     <h3>Errors</h3>
                     {this.displayErrors(errors)}
                  </Message>
               )}
               <Message>
                  Don't have an account? <Link to="/register">Register</Link>
               </Message>
            </Grid.Column>
         </Grid>
      )
   }
};

export default Login;