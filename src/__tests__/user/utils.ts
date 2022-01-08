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
