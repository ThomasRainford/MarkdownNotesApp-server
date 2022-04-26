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

export const notesListQuery = `
query NotesList($listLocation: ListLocationInput!) {
  notesList(listLocation: $listLocation) {
    id
    title
    notes {
      title
    }
    collection {
      id
      title
      lists {
        title
      }
    }
  }
}
`;

export const notesListsQuery = `
query NotesLists($collectionId: String!) {
  notesLists(collectionId: $collectionId) {
    id
    title
    notes {
      id
      title
    }
  }
}
`;

export const noteQuery = `
query Note($noteLocation: NoteLocationInput!) {
  note(noteLocation: $noteLocation) {
    note {
      id
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

export const updateNotesListMutation = `
mutation UpdateNotesList($listLocation: ListLocationInput!, $notesListInput: NotesListUpdateInput!) {
  updateNotesList(listLocation: $listLocation, notesListInput: $notesListInput) {
      notesList {
          id
          title
      }
      error {
          property
          message
      }
  }
}
`;

export const updateNoteMutation = `
mutation UpdateNote($noteLocation: NoteLocationInput!, $noteInput: NoteUpdateInput!) {
  updateNote(noteLocaton: $noteLocation, noteInput: $noteInput) {
      note {
          id
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

export const deleteNotesListMutation = `
mutation DeleteNotesList($listLocation: ListLocationInput!) {
  deleteNotesList(listLocation: $listLocation)
}
`;
