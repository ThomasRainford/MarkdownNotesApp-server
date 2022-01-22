export const registerMutation = `
mutation Register($registerInput: UserRegisterInput!) {
  register(registerInput: $registerInput) {
    user {
      _id
      email
      username
    }
    errors {
      field
      message
    }
  }
}
`;

export const meQuery = `
query {
  me {
    id
    username
    email
  }
}
`;

export const userQuery = `
query User($username: String!){
  user(username: $username) {
    id
    username
    email
  }
}
`;

export const loginMutation = `
  mutation Login($usernameOrEmail: String!, $password: String!){
    login(usernameOrEmail: $usernameOrEmail, password: $password) {
      user {
        id
        email
        username
      }
      errors {
        field
        message
      }
    }
  }
`;
