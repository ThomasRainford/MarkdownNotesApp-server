export const createNotesListsMutation = `
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

export const addNoteMutation = `
mutation AddNote($listLocation: ListLocationInput!, $noteInput: NoteInput!) {
  addNote(listLocation: $listLocation, noteInput: $noteInput) {
      note {
          title
          body
      }
      error {
          property
          message
      }
  }
}
`;
