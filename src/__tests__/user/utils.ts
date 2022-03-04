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

export const logoutMutation = `
  mutation {
    logout {
      id
      email
      username
    }
  }
`;

export const updateUserMutation = `
  mutation updateUser($username: String, $password: String){
    updateUser(username: $username, password: $password) {
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

export const followMutation = `
  mutation follow($targetUserId: String!){
    follow(targetUserId: $targetUserId)
  }
`;

export const followingQuery = `
  query following {
    following {
      id
      username
      followers
    }
  }
`;

export const followersQuery = `
  query followers {
    followers {
      id
      username
      following
    }
  }
`;
