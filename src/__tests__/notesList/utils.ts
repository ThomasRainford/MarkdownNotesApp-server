export const createNotesListsQuery = `
mutation CreateNotesList($collectionId: String!, $title: String!){
  createNotesList(collectionId: $collectionId, title: $title) {
    notesList {
      title
      collection {
        id
      }
    }
    error {
        property
        message
    }
  }
}
`;
