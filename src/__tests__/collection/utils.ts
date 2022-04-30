export const createCollectionMutation = `
mutation CreateCollection($title: String!, $visibility: String!) {
  createCollection(title: $title, visibility: $visibility) {
      collection {
          id
          title
      }
  }
}`;

export const collectionQuery = `
query collection($id: String, $title: String) {
  collection(id: $id, title: $title) {
      collection {
          id
          title
          owner {
              id
              username
          }
          lists {
              id
              title
          }
      }
      error {
          property
          message
      }
  }
}`;

export const collectionsQuery = `
query collections {
  collections {
      id
      title
      owner {
          id
          username
      }
      lists {
          id
          title
      }
  }
}`;

export const userCollectionsQuery = `
query userCollections($id: String!) {
  userCollections(id: $id) {
      id
      title
      owner {
          id
          username
      }
      lists {
          id
          title
      }
  }
}`;

export const updateCollectionMutation = `
mutation UpdateCollection($id: String!, $collectionInput: CollectionUpdateInput!) {
  updateCollection(id: $id, collectionInput: $collectionInput) {
      collection {
          id
          title
          owner {
              id
              username
          }
      }
      error {
          property
          message
      }
  }
}`;

export const voteMutation = `
mutation Vote($id: String!) {
  vote(id: $id) {
      collection {
          id
          title
          upvotes
          owner {
              id
              username
              upvoted
          }
      }
      error {
          property
          message
      }
  }
}`;

export const deleteCollectionMutation = `
mutation DeleteCollection($id: String!) {
  deleteCollection(id: $id)
}`;
